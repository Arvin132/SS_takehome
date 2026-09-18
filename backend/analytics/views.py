from decimal import Decimal

from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_q.tasks import async_task
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.caching import SNAPSHOT_CACHE_TIMEOUT, snapshot_cache_key
from analytics.models import PlantDayAiSummary, PlantDayAnalytics
from analytics.serializers import FleetAnalyticsSerializer, PlantDayAiSummarySerializer
from core.models import CrewAssignment, PlantDay

ZERO = Decimal('0')
QUEUE_LOCK_SECONDS = 120


def queue_compute_once(plant_day_id):
    """Debounces duplicate django-q dispatches for the same plant_day: an `add` on the
    DB cache is an atomic 'was this already queued recently' check without touching
    django-q's own broker tables."""
    lock_key = f'analytics:queued:{plant_day_id}'
    if cache.add(lock_key, True, timeout=QUEUE_LOCK_SECONDS):
        async_task('analytics.tasks.compute_batch', [plant_day_id])


def queue_ai_summary_once(plant_day_id):
    """Same debounce as queue_compute_once, keyed separately so a spike of dashboard
    traffic can't accidentally suppress a user's explicit 'generate summary' click."""
    lock_key = f'ai-summary:queued:{plant_day_id}'
    if cache.add(lock_key, True, timeout=QUEUE_LOCK_SECONDS):
        async_task('analytics.tasks.generate_ai_summary', plant_day_id)


def _computing_entry(plant, today):
    return {
        'plant': plant,
        'date': today,
        'status': 'computing',
        'estimate_loss_usd': None,
        'estimate_loss_kwh': None,
        'estimate_recovery': None,
        'cleaning_cost': None,
        'recommend_crew': None,
        'assignment_exists': False,
    }


def _ready_entry(plant, today, analytics, assigned):
    return {
        'plant': plant,
        'date': today,
        'status': 'ready',
        'estimate_loss_usd': analytics.estimate_loss_usd,
        'estimate_loss_kwh': analytics.estimate_loss_kwh,
        'estimate_recovery': analytics.estimate_recovery,
        'cleaning_cost': analytics.cleaning_cost,
        'recommend_crew': analytics.recommend_crew,
        'assignment_exists': assigned,
    }


def build_fleet_snapshot(user, today):
    """Today's recommendation for every plant the user owns. Missing reports get queued
    for the background worker (once) and come back as 'computing' instead of blocking."""
    plants_by_id = {plant.id: plant for plant in user.plants.with_latest_day()}

    plant_days = PlantDay.objects.filter(plant_id__in=plants_by_id, date__date=today)
    analytics_by_day_id = PlantDayAnalytics.objects.for_plant_days(plant_days)
    assigned_plant_ids = set(
        CrewAssignment.objects.filter(plant_id__in=plants_by_id, date__date=today)
        .values_list('plant_id', flat=True)
    )

    results = []
    total_loss_usd = ZERO
    total_loss_kwh = ZERO
    total_recovery_usd = ZERO

    for day in plant_days.order_by('plant_id'):
        plant = plants_by_id[day.plant_id]
        analytics = analytics_by_day_id.get(day.id)

        if analytics is None:
            queue_compute_once(day.id)
            results.append(_computing_entry(plant, today))
            continue

        total_loss_usd += analytics.estimate_loss_usd
        total_loss_kwh += analytics.estimate_loss_kwh
        # A plant with no crew worth dispatching still stores its (negative) best-case net
        # gain; "possible recoverables" is only the upside actually worth acting on.
        total_recovery_usd += max(analytics.estimate_recovery, ZERO)
        results.append(_ready_entry(plant, today, analytics, day.plant_id in assigned_plant_ids))

    return {
        'date': today,
        'summary': {
            'total_plants': len(plants_by_id),
            'total_loss_usd': total_loss_usd,
            'total_loss_kwh': total_loss_kwh,
            'possible_recovery_usd': total_recovery_usd,
        },
        'results': results,
    }


class FleetAnalyticsMineView(APIView):
    def get(self, request):
        today = timezone.localdate()
        key = snapshot_cache_key(request.user.id, today)

        data = cache.get(key)
        if data is None:
            snapshot = build_fleet_snapshot(request.user, today)
            data = FleetAnalyticsSerializer(snapshot).data
            cache.set(key, data, SNAPSHOT_CACHE_TIMEOUT)

        return Response(data)


NO_SUMMARY_YET = {'status': 'none', 'summary': None, 'error': None, 'updated_at': None}


class PlantAiSummaryView(APIView):
    """One-and-done AI summary for a plant's *today* row: GET reads whatever state
    exists (nothing requested yet / queued / ready / failed), POST (re)queues generation.
    No streaming, no polling -- the frontend just re-GETs on demand or on refresh."""

    def _today_plant_day(self, plant_id):
        today = timezone.localdate()
        return get_object_or_404(PlantDay, plant_id=plant_id, date__date=today)

    def get(self, request, plant_id):
        plant_day = self._today_plant_day(plant_id)
        summary = PlantDayAiSummary.objects.filter(plant_day=plant_day).first()
        data = PlantDayAiSummarySerializer(summary).data if summary else NO_SUMMARY_YET
        return Response(data)

    def post(self, request, plant_id):
        plant_day = self._today_plant_day(plant_id)
        summary = PlantDayAiSummary.mark_pending(plant_day)
        queue_ai_summary_once(plant_day.id)
        return Response(PlantDayAiSummarySerializer(summary).data, status=202)

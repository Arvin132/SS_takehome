import logging
from collections import defaultdict
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django_q.tasks import async_task

from analytics.ai_summary import (
    AssignmentFacts,
    DayFacts,
    DaySummaryContext,
    RecommendationFacts,
    generate_summary,
)
from analytics.caching import invalidate_snapshot_cache
from analytics.models import PlantDayAiSummary, PlantDayAnalytics
from analytics.recommendation import (
    TREND_LOOKBACK_DAYS,
    CrewOption,
    PlantDayHistoryEntry,
    PlantSnapshot,
    recommend_cleaning,
)
from core.models import Crew, CrewAssignment, PlantDay, User

logger = logging.getLogger(__name__)

BATCH_SIZE = 25
AI_SUMMARY_HISTORY_DAYS = 3


def _load_history_by_plant(plant_ids, before_date, lookback_days):
    """One query for the whole batch: each plant's PlantDay rows strictly before
    `before_date`, newest first, truncated to `lookback_days` and reversed to oldest-first."""
    rows = (
        PlantDay.objects.filter(plant_id__in=plant_ids, date__lt=before_date)
        .select_related('plantdayevent')
        .order_by('plant_id', '-date')
    )
    by_plant = {}
    for row in rows:
        bucket = by_plant.setdefault(row.plant_id, [])
        if len(bucket) < lookback_days:
            bucket.append(row)
    for bucket in by_plant.values():
        bucket.reverse()
    return by_plant


def _load_crews_by_plant(plant_ids):
    """One query for the whole batch, same relationship core.views.PlantCrewsView uses."""
    rows = Crew.objects.filter(serviceable_plants__id__in=plant_ids).values_list(
        'id', 'mw_per_day', 'day_rate_usd', 'serviceable_plants'
    )
    by_plant = {}
    for crew_id, mw_per_day, day_rate_usd, plant_id in rows:
        by_plant.setdefault(plant_id, []).append(
            CrewOption(crew_id=crew_id, mw_per_day=mw_per_day, day_rate_usd=day_rate_usd)
        )
    return by_plant


def _owner_ids_by_plant(plant_ids):
    """One query for the whole batch: {plant_id: [owner user ids]}."""
    rows = User.plants.through.objects.filter(plant_id__in=plant_ids).values_list(
        'plant_id', 'user_id'
    )
    by_plant = defaultdict(list)
    for plant_id, user_id in rows:
        by_plant[plant_id].append(user_id)
    return by_plant


def _to_history_entry(plant_day):
    event = getattr(plant_day, 'plantdayevent', None)
    return PlantDayHistoryEntry(
        expected_energy_kwh=plant_day.expected_energy_kwh,
        soiling_loss_pct=plant_day.soiling_loss_pct,
        performance_ratio=plant_day.performance_ratio,
        rain_mm=event.rain_mm if event else Decimal('0'),
        cleaned=event.cleaned if event else False,
    )


def compute_batch(plant_day_ids: list[int]):
    """Compute and store PlantDayAnalytics for a batch of PlantDay ids. Safe to call with
    a single id (signal-triggered) or many (nightly batch) -- this is the only place that
    locks, fetches, computes and writes for the feature.

    select_for_update(of=('self',)) is required here: without it, the LEFT OUTER JOIN to
    plantdayevent makes Postgres reject a bare FOR UPDATE outright, and it would also lock
    the joined Plant row, making unrelated plant_days on the same plant contend for no reason.
    """
    with transaction.atomic():
        locked_days = list(
            PlantDay.objects.select_for_update(skip_locked=True, of=('self',))
            .filter(pk__in=plant_day_ids)
            .select_related('plant', 'plantdayevent')
        )
        if not locked_days:
            return

        plant_ids = {day.plant_id for day in locked_days}
        cutoff = min(day.date for day in locked_days)
        history_by_plant = _load_history_by_plant(plant_ids, cutoff, TREND_LOOKBACK_DAYS)
        crews_by_plant = _load_crews_by_plant(plant_ids)

        rows = []
        for day in locked_days:
            try:
                history = [_to_history_entry(d) for d in history_by_plant.get(day.plant_id, [])]
                crews = crews_by_plant.get(day.plant_id, [])
                event = getattr(day, 'plantdayevent', None)
                snapshot = PlantSnapshot(
                    capacity_mw=day.plant.capacity_mw,
                    tariff_per_kwh=day.plant.tariff_per_kwh,
                    days_until_next_reset=day.days_until_next_reset,
                )
                rec = recommend_cleaning(
                    snapshot, history, crews,
                    today_rain_mm=event.rain_mm if event else Decimal('0'),
                )
                rows.append(PlantDayAnalytics(
                    plant_day=day,
                    estimate_loss_usd=rec.estimate_loss_usd,
                    estimate_loss_kwh=rec.estimate_loss_kwh,
                    estimate_recovery=rec.estimate_recovery_usd,
                    recommend_crew_id=rec.recommended_crew.crew_id if rec.recommended_crew else None,
                    cleaning_cost=rec.cleaning_cost_usd,
                ))
            except Exception:
                logger.exception('recommendation compute failed for plant_day %s', day.id)

        if rows:
            PlantDayAnalytics.objects.bulk_create(
                rows,
                update_conflicts=True,
                unique_fields=['plant_day'],
                update_fields=[
                    'estimate_loss_usd', 'estimate_loss_kwh', 'estimate_recovery',
                    'recommend_crew', 'cleaning_cost',
                ],
            )

        owners_by_plant = _owner_ids_by_plant(plant_ids)
        stale_users_by_date = defaultdict(set)
        for day in locked_days:
            stale_users_by_date[day.date.date()].update(owners_by_plant.get(day.plant_id, []))
        for day_date, user_ids in stale_users_by_date.items():
            invalidate_snapshot_cache(user_ids, day_date)


def _day_facts(plant_day):
    event = getattr(plant_day, 'plantdayevent', None)
    return DayFacts(
        date=plant_day.date.date().isoformat(),
        energy_kwh=plant_day.energy_kwh,
        expected_energy_kwh=plant_day.expected_energy_kwh,
        performance_ratio=plant_day.performance_ratio,
        soiling_loss_pct=plant_day.soiling_loss_pct,
        rain_mm=event.rain_mm if event else Decimal('0'),
        cleaned=event.cleaned if event else False,
    )


def _load_recent_history(plant_day):
    """The `AI_SUMMARY_HISTORY_DAYS` days strictly before this one, oldest-first."""
    rows = list(
        PlantDay.objects.filter(plant_id=plant_day.plant_id, date__lt=plant_day.date)
        .select_related('plantdayevent')
        .order_by('-date')[:AI_SUMMARY_HISTORY_DAYS]
    )
    rows.reverse()
    return [_day_facts(row) for row in rows]


def _recommendation_facts(plant_day):
    analytics = PlantDayAnalytics.objects.filter(plant_day=plant_day).select_related('recommend_crew').first()
    if analytics is None:
        return None
    return RecommendationFacts(
        estimate_loss_usd=analytics.estimate_loss_usd,
        estimate_loss_kwh=analytics.estimate_loss_kwh,
        estimate_recovery_usd=analytics.estimate_recovery,
        cleaning_cost_usd=analytics.cleaning_cost,
        recommended_crew_home_base=analytics.recommend_crew.home_base if analytics.recommend_crew else None,
    )


def _assignment_facts(plant_day):
    assignment = (
        CrewAssignment.objects.filter(plant_id=plant_day.plant_id, date__date=plant_day.date.date())
        .select_related('crew')
        .first()
    )
    if assignment is None:
        return None
    return AssignmentFacts(
        crew_home_base=assignment.crew.home_base,
        estimate_days=assignment.estimate_days,
        estimate_cost_usd=assignment.estimate_cost,
    )


def generate_ai_summary(plant_day_id):
    """Builds the day's context (plant, telemetry, recommendation, assignment, 3-day
    history) and asks Gemini to summarize it. Gated on GEMINI_API_KEY so the rest of
    the app keeps working when no LLM key is configured -- it just marks the row failed."""
    try:
        plant_day = PlantDay.objects.select_related('plant', 'plantdayevent').get(pk=plant_day_id)
    except PlantDay.DoesNotExist:
        return

    summary_row = PlantDayAiSummary.mark_pending(plant_day)

    if not settings.GEMINI_API_KEY:
        summary_row.mark_failed('AI summaries are not configured (missing GEMINI_API_KEY).')
        return

    try:
        context = DaySummaryContext(
            plant_name=plant_day.plant.name,
            plant_region=plant_day.plant.region,
            capacity_mw=plant_day.plant.capacity_mw,
            tariff_per_kwh=plant_day.plant.tariff_per_kwh,
            cleaning_cost_usd=plant_day.plant.cleaning_cost_usd,
            days_until_next_reset=plant_day.days_until_next_reset,
            today=_day_facts(plant_day),
            history=_load_recent_history(plant_day),
            recommendation=_recommendation_facts(plant_day),
            assignment=_assignment_facts(plant_day),
        )
        summary_text = generate_summary(context)
    except Exception as exc:
        logger.exception('ai summary generation failed for plant_day %s', plant_day_id)
        summary_row.mark_failed(str(exc))
        return

    summary_row.mark_ready(summary_text)


def run_nightly_batch():
    """Scheduled entry point (see bootstrap_schedule): recompute today's recommendation
    for every plant, dispatched as independent chunked tasks so the 2-worker cluster runs
    them concurrently instead of one at a time."""
    today = timezone.localdate()
    plant_day_ids = list(
        PlantDay.objects.filter(date__date=today).order_by('id').values_list('id', flat=True)
    )
    group = f'nightly-recommendations-{today.isoformat()}'
    for start in range(0, len(plant_day_ids), BATCH_SIZE):
        chunk = plant_day_ids[start:start + BATCH_SIZE]
        async_task('analytics.tasks.compute_batch', chunk, group=group)

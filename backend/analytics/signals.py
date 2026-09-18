from django.db import transaction
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver
from django_q.tasks import async_task

from analytics.caching import invalidate_snapshot_cache
from analytics.models import PlantDayAnalytics
from core.models import Crew, CrewAssignment, Plant, PlantDay, PlantDayEvent


def _invalidate_and_requeue(plant_day_id):
    PlantDayAnalytics.objects.filter(plant_day_id=plant_day_id).delete()
    transaction.on_commit(
        lambda: async_task('analytics.tasks.compute_batch', [plant_day_id])
    )


def _latest_day_ids_for_plants(plant_ids):
    ids = []
    for plant in Plant.objects.filter(pk__in=plant_ids).with_latest_day():
        day = plant.latest_day()
        if day:
            ids.append(day.id)
    return ids


@receiver(post_save, sender=PlantDay)
@receiver(post_delete, sender=PlantDay)
def on_plant_day_changed(sender, instance, **kwargs):
    _invalidate_and_requeue(instance.id)


@receiver(post_save, sender=PlantDayEvent)
@receiver(post_delete, sender=PlantDayEvent)
def on_plant_day_event_changed(sender, instance, **kwargs):
    _invalidate_and_requeue(instance.plant_day_id)


@receiver(post_save, sender=Crew)
def on_crew_changed(sender, instance, **kwargs):
    plant_ids = instance.serviceable_plants.values_list('id', flat=True)
    for plant_day_id in _latest_day_ids_for_plants(plant_ids):
        _invalidate_and_requeue(plant_day_id)


@receiver(m2m_changed, sender=Crew.serviceable_plants.through)
def on_crew_plants_changed(sender, instance, action, pk_set, **kwargs):
    if action not in ('post_add', 'post_remove') or not pk_set:
        return
    for plant_day_id in _latest_day_ids_for_plants(pk_set):
        _invalidate_and_requeue(plant_day_id)


@receiver(post_save, sender=CrewAssignment)
@receiver(post_delete, sender=CrewAssignment)
def on_crew_assignment_changed(sender, instance, **kwargs):
    """Dispatching (or un-dispatching) a crew changes the dashboard's 'already
    assigned' flag for that plant's owners on that day."""
    owner_ids = Plant.objects.filter(pk=instance.plant_id).values_list('owners__id', flat=True)
    invalidate_snapshot_cache(owner_ids, instance.date.date())

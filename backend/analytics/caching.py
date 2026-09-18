from django.core.cache import cache
from django.utils import timezone

# Uses the project's default cache (see solar/settings.py: Django's DB-backed cache),
# not a separate store.
SNAPSHOT_CACHE_PREFIX = 'fleet-analytics-mine'
SNAPSHOT_CACHE_TIMEOUT = 60 * 60 * 6


def snapshot_cache_key(user_id, day):
    return f'{SNAPSHOT_CACHE_PREFIX}:{user_id}:{day.isoformat()}'


def invalidate_snapshot_cache(user_ids, day=None):
    """Drops the cached dashboard snapshot for each user so their next request rebuilds
    it. Called wherever something the dashboard reads changes: a freshly computed
    PlantDayAnalytics report, or a CrewAssignment created/removed for one of today's
    plants."""
    day = day or timezone.localdate()
    keys = [snapshot_cache_key(uid, day) for uid in {uid for uid in user_ids if uid is not None}]
    if keys:
        cache.delete_many(keys)

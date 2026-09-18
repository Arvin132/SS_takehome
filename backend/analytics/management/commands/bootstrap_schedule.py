from django.core.management.base import BaseCommand
from django_q.models import Schedule

NIGHTLY_SCHEDULE_NAME = 'nightly-recommendation-batch'


class Command(BaseCommand):
    help = 'Idempotently creates/updates the nightly PlantDayAnalytics batch schedule.'

    def handle(self, *args, **options):
        Schedule.objects.update_or_create(
            name=NIGHTLY_SCHEDULE_NAME,
            defaults=dict(
                func='analytics.tasks.run_nightly_batch',
                schedule_type=Schedule.CRON,
                cron='0 2 * * *',
                repeats=-1,
            ),
        )
        self.stdout.write(self.style.SUCCESS('Nightly recommendation schedule is set.'))

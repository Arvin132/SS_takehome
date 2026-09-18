from django.db import models

# Create your models here.

class PlantDayAnalyticsQuerySet(models.QuerySet):
    def for_plant_days(self, plant_days):
        """Keyed by plant_day_id so callers can look up 'does this day have a report yet'
        without a query per plant."""
        rows = self.filter(plant_day__in=plant_days).select_related('recommend_crew')
        return {row.plant_day_id: row for row in rows}


class PlantDayAnalytics(models.Model):
    plant_day = models.OneToOneField("core.PlantDay", on_delete=models.CASCADE)
    estimate_loss_usd = models.DecimalField(max_digits=10, decimal_places=2)
    estimate_loss_kwh = models.DecimalField(max_digits=10, decimal_places=2)
    estimate_recovery = models.DecimalField(max_digits=10, decimal_places=2)
    recommend_crew = models.ForeignKey("core.Crew", on_delete=models.SET_NULL, null=True, blank=True)
    cleaning_cost = models.DecimalField(max_digits=10, decimal_places=2)

    objects = PlantDayAnalyticsQuerySet.as_manager()


class PlantDayAiSummary(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_READY = 'ready'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_READY, 'Ready'),
        (STATUS_FAILED, 'Failed'),
    ]

    plant_day = models.OneToOneField("core.PlantDay", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    summary = models.TextField(blank=True)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def mark_pending(cls, plant_day):
        """Called right when the user clicks 'generate' -- resets any previous
        result so a refresh before the worker finishes shows 'pending', not stale text."""
        obj, _ = cls.objects.update_or_create(
            plant_day=plant_day,
            defaults={'status': cls.STATUS_PENDING, 'summary': '', 'error': ''},
        )
        return obj

    def mark_ready(self, summary_text):
        self.status = self.STATUS_READY
        self.summary = summary_text
        self.error = ''
        self.save(update_fields=['status', 'summary', 'error', 'updated_at'])

    def mark_failed(self, error_text):
        self.status = self.STATUS_FAILED
        self.error = error_text
        self.save(update_fields=['status', 'error', 'updated_at'])


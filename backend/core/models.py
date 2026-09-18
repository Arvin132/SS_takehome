from datetime import date, datetime, time
from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# Create your models here.

RAIN_RESET_THRESHOLD_MM = Decimal('8.0')


class PlantQuerySet(models.QuerySet):
    def with_latest_day(self):
        """Prefetch each plant's PlantDay rows (newest first) in one extra query,
        so latest_day() reads from the cache instead of querying per plant."""
        latest_day_rows = PlantDay.objects.order_by('-date').only('plant_id', 'date', 'days_until_next_reset')
        return self.prefetch_related(
            models.Prefetch('plantday_set', queryset=latest_day_rows, to_attr='_prefetched_days')
        )


class Plant(models.Model):
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=100)
    capacity_mw = models.DecimalField(max_digits=15, decimal_places=10)
    tariff_per_kwh = models.DecimalField(max_digits=10, decimal_places=2)
    cleaning_cost_usd = models.DecimalField(max_digits=10, decimal_places=2)
    creation_date = models.DateTimeField()

    objects = PlantQuerySet.as_manager()

    @classmethod
    def from_csv_row(cls, row):
        commissioned_on = date.fromisoformat(row['commissioned_on'])
        return cls(
            name=row['name'],
            region=row['region'],
            capacity_mw=Decimal(row['capacity_mw']),
            tariff_per_kwh=Decimal(row['tariff_per_kwh']),
            cleaning_cost_usd=Decimal(row['cleaning_cost_usd']),
            creation_date=timezone.make_aware(datetime.combine(commissioned_on, time.min)),
        )

    def latest_day(self):
        prefetched = getattr(self, '_prefetched_days', None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None
        return self.plantday_set.order_by('-date').first()


class PlantDay(models.Model):
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    energy_kwh = models.DecimalField(max_digits=20, decimal_places=10)
    expected_energy_kwh = models.DecimalField(max_digits=20, decimal_places=10)
    performance_ratio = models.DecimalField(max_digits=15, decimal_places=10, null=True, blank=True)
    soiling_loss_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    days_until_next_reset = models.IntegerField()
    date = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['plant_id', 'date'],
                name='unique_plant_date_relation'
            )
        ]

    @classmethod
    def from_csv_row(cls, row, plant):
        return cls(
            plant=plant,
            date=timezone.make_aware(datetime.combine(date.fromisoformat(row['date']), time.min)),
            energy_kwh=Decimal(row['energy_kwh']),
            expected_energy_kwh=Decimal(row['expected_energy_kwh']),
            performance_ratio=Decimal(row['pr']) if row['pr'] else None,
            soiling_loss_pct=Decimal(row['soiling_loss_pct']) if row['soiling_loss_pct'] else None,
            days_until_next_reset=0,  # placeholder, overwritten by backfill_days_until_next_reset
        )

    @classmethod
    def build_today(cls, plant, today, days_until_next_reset):
        return cls(
            plant=plant,
            date=timezone.make_aware(datetime.combine(today, time.min)),
            energy_kwh=0,
            expected_energy_kwh=0,
            performance_ratio=None,
            soiling_loss_pct=None,
            days_until_next_reset=days_until_next_reset,
        )

    @classmethod
    def backfill_days_until_next_reset(cls, plant):
        """Walk a plant's days newest-first; today's value is already known,
        every earlier day counts up from it unless that day itself rained >= 8mm."""
        days = list(
            cls.objects.filter(plant=plant)
            .select_related('plantdayevent')
            .order_by('-date')
        )
        next_value = None
        for day in days:
            if next_value is None:
                next_value = day.days_until_next_reset
                continue
            rained = day.plantdayevent.rain_mm >= RAIN_RESET_THRESHOLD_MM
            day.days_until_next_reset = 0 if rained else next_value + 1
            next_value = day.days_until_next_reset
        cls.objects.bulk_update(days, ['days_until_next_reset'])


class PlantDayEvent(models.Model):
    plant_day = models.OneToOneField(PlantDay, on_delete=models.CASCADE)
    rain_mm = models.DecimalField(max_digits=5, decimal_places=1)
    cleaned = models.BooleanField()

    @classmethod
    def from_csv_row(cls, row, plant_day):
        return cls(
            plant_day=plant_day,
            rain_mm=Decimal(row['rain_mm']),
            cleaned=bool(int(row['cleaned'])),
        )


class Crew(models.Model):
    home_base = models.CharField(max_length=100)
    mw_per_day = models.DecimalField(max_digits=15, decimal_places=10)
    day_rate_usd = models.DecimalField(max_digits=15, decimal_places=10)
    serviceable_plants = models.ManyToManyField(Plant, related_name='crews')

    @classmethod
    def from_csv_row(cls, row):
        return cls(
            home_base=row['home_base'],
            mw_per_day=Decimal(row['mw_per_day']),
            day_rate_usd=Decimal(row['day_rate_usd']),
        )

    def assign_serviceable_plants(self, plants):
        self.serviceable_plants.set(plants)

class CrewAssignment(models.Model):
    crew = models.ForeignKey(Crew, on_delete=models.CASCADE)
    plant = models.ForeignKey(Plant, on_delete=models.CASCADE)
    date = models.DateTimeField()
    estimate_days = models.IntegerField()
    estimate_cost = models.DecimalField(max_digits=10, decimal_places=2)


    class Meta:
        constraints = [
            models.UniqueConstraint(
                # Field names, not attnames: DRF's ModelSerializer only auto-generates a
                # UniqueTogetherValidator when constraint.fields matches serializer field sources.
                fields = ['crew', 'plant', 'date'],
                name='unique_crew_plant_date_relation'
            )
        ]


class User(AbstractUser):
    plants = models.ManyToManyField(Plant, related_name='owners')

    def assign_plants(self, plants):
        self.plants.set(plants)

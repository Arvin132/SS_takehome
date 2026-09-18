from rest_framework import serializers

from core.models import Crew, CrewAssignment, Plant, PlantDay, PlantDayEvent, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class PlantSerializer(serializers.ModelSerializer):
    days_until_next_reset = serializers.SerializerMethodField()

    class Meta:
        model = Plant
        fields = [
            'id', 'name', 'region', 'capacity_mw', 'tariff_per_kwh',
            'cleaning_cost_usd', 'days_until_next_reset', 'creation_date',
        ]

    def get_days_until_next_reset(self, obj):
        latest_day = obj.latest_day()
        return latest_day.days_until_next_reset if latest_day else None


class PlantDayEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantDayEvent
        fields = ['rain_mm', 'cleaned']


class PlantDaySerializer(serializers.ModelSerializer):
    event = PlantDayEventSerializer(source='plantdayevent', read_only=True)

    class Meta:
        model = PlantDay
        fields = [
            'id', 'plant', 'date', 'energy_kwh', 'expected_energy_kwh',
            'performance_ratio', 'soiling_loss_pct', 'days_until_next_reset', 'event',
        ]


class CrewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crew
        fields = ['id', 'home_base', 'mw_per_day', 'day_rate_usd']


class CrewAssignmentSerializer(serializers.ModelSerializer):
    plant_name = serializers.CharField(source='plant.name', read_only=True)

    class Meta:
        model = CrewAssignment
        fields = ['id', 'crew', 'plant', 'plant_name', 'date', 'estimate_days', 'estimate_cost']

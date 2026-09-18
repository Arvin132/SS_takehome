from rest_framework import serializers

from analytics.models import PlantDayAiSummary
from core.models import Crew
from core.serializers import PlantSerializer


class RecommendedCrewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crew
        fields = ['id', 'home_base', 'mw_per_day', 'day_rate_usd']


class PlantAnalyticsSerializer(serializers.Serializer):
    plant = PlantSerializer()
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=['ready', 'computing'])
    estimate_loss_usd = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    estimate_loss_kwh = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    estimate_recovery = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    cleaning_cost = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    recommend_crew = RecommendedCrewSerializer(allow_null=True)
    assignment_exists = serializers.BooleanField()


class FleetAnalyticsSummarySerializer(serializers.Serializer):
    total_plants = serializers.IntegerField()
    total_loss_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_loss_kwh = serializers.DecimalField(max_digits=12, decimal_places=2)
    possible_recovery_usd = serializers.DecimalField(max_digits=12, decimal_places=2)


class FleetAnalyticsSerializer(serializers.Serializer):
    date = serializers.DateField()
    summary = FleetAnalyticsSummarySerializer()
    results = PlantAnalyticsSerializer(many=True)


class PlantDayAiSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantDayAiSummary
        fields = ['status', 'summary', 'error', 'updated_at']

from django.urls import path

from analytics.views import FleetAnalyticsMineView, PlantAiSummaryView

urlpatterns = [
    path('mine/', FleetAnalyticsMineView.as_view(), name='analytics-mine'),
    path('plants/<int:plant_id>/ai-summary/', PlantAiSummaryView.as_view(), name='plant-ai-summary'),
]

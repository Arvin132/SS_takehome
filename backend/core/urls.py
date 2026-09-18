from django.urls import path

from core.views import (
    AssignmentDetailView,
    AssignmentListCreateView,
    AssignmentMineView,
    CrewDetailView,
    CrewListCreateView,
    CrewMineView,
    CrewPlantMappingDetailView,
    CrewPlantMappingView,
    LoginView,
    LogoutView,
    PlantCrewsView,
    PlantDaysView,
    PlantDetailView,
    PlantListCreateView,
    PlantMineView,
    PlantUserMappingDetailView,
    PlantUserMappingView,
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    path('plants/', PlantListCreateView.as_view(), name='plant-list'),
    path('plants/mine/', PlantMineView.as_view(), name='plant-mine'),
    path('plants/<int:pk>/', PlantDetailView.as_view(), name='plant-detail'),
    path('plants/<int:plant_id>/days/', PlantDaysView.as_view(), name='plant-days'),
    path('plants/<int:plant_id>/crews/', PlantCrewsView.as_view(), name='plant-crews'),
    path('plants/<int:plant_id>/users/', PlantUserMappingView.as_view(), name='plant-users'),
    path('plants/<int:plant_id>/users/<int:user_id>/', PlantUserMappingDetailView.as_view(), name='plant-users-detail'),

    path('crews/', CrewListCreateView.as_view(), name='crew-list'),
    path('crews/mine/', CrewMineView.as_view(), name='crew-mine'),
    path('crews/<int:pk>/', CrewDetailView.as_view(), name='crew-detail'),
    path('crews/<int:crew_id>/plants/', CrewPlantMappingView.as_view(), name='crew-plants'),
    path('crews/<int:crew_id>/plants/<int:plant_id>/', CrewPlantMappingDetailView.as_view(), name='crew-plants-detail'),

    path('assignments/', AssignmentListCreateView.as_view(), name='assignment-list'),
    path('assignments/mine/', AssignmentMineView.as_view(), name='assignment-mine'),
    path('assignments/<int:pk>/', AssignmentDetailView.as_view(), name='assignment-detail'),
]

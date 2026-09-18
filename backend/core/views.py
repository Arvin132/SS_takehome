from django.conf import settings
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework.request import Request
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import Crew, CrewAssignment, Plant, PlantDay, User
from core.serializers import (
    CrewAssignmentSerializer,
    CrewSerializer,
    PlantDaySerializer,
    PlantSerializer,
    UserSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials.'}, status=401)

        token, _ = Token.objects.get_or_create(user=user)
        response = Response(UserSerializer(user).data)
        response.set_cookie(
            settings.AUTH_TOKEN_COOKIE_NAME,
            token.key,
            httponly=True,
            samesite='Lax',
            secure=not settings.DEBUG,
        )
        return response

    # Session probe: the client calls this on load to find out who, if anyone, the cookie belongs to.
    def get(self, request: Request):
        user: User = request.user
        if not user.is_authenticated:
            return Response({'detail': 'Not authenticated.'}, status=401)
        return Response(UserSerializer(user).data)



class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        response = Response(status=204)
        response.delete_cookie(settings.AUTH_TOKEN_COOKIE_NAME)
        return response


class PlantListCreateView(generics.ListCreateAPIView):
    queryset = Plant.objects.with_latest_day()
    serializer_class = PlantSerializer


class PlantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plant.objects.with_latest_day()
    serializer_class = PlantSerializer


class PlantMineView(generics.ListAPIView):
    serializer_class = PlantSerializer

    def get_queryset(self):
        return self.request.user.plants.with_latest_day()


class PlantDaysView(generics.ListAPIView):
    serializer_class = PlantDaySerializer

    def get_queryset(self):
        return (
            PlantDay.objects.filter(plant_id=self.kwargs['plant_id'])
            .select_related('plantdayevent')
            .order_by('-date')
        )


class PlantCrewsView(generics.ListAPIView):
    serializer_class = CrewSerializer

    def get_queryset(self):
        return Crew.objects.filter(serviceable_plants__id=self.kwargs['plant_id'])


class PlantUserMappingView(generics.ListCreateAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        return get_object_or_404(Plant, pk=self.kwargs['plant_id']).owners.all()

    def create(self, request, *args, **kwargs):
        plant = get_object_or_404(Plant, pk=self.kwargs['plant_id'])
        user = get_object_or_404(User, pk=request.data.get('user_id'))
        plant.owners.add(user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class PlantUserMappingDetailView(APIView):
    def delete(self, request, plant_id, user_id):
        plant = get_object_or_404(Plant, pk=plant_id)
        user = get_object_or_404(User, pk=user_id)
        plant.owners.remove(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CrewListCreateView(generics.ListCreateAPIView):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer


class CrewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Crew.objects.all()
    serializer_class = CrewSerializer


class CrewMineView(generics.ListAPIView):
    serializer_class = CrewSerializer

    def get_queryset(self):
        return Crew.objects.filter(serviceable_plants__in=self.request.user.plants.all()).distinct()


class CrewPlantMappingView(generics.ListCreateAPIView):
    serializer_class = PlantSerializer

    def get_queryset(self):
        return get_object_or_404(Crew, pk=self.kwargs['crew_id']).serviceable_plants.with_latest_day()

    def create(self, request, *args, **kwargs):
        crew = get_object_or_404(Crew, pk=self.kwargs['crew_id'])
        plant = get_object_or_404(Plant, pk=request.data.get('plant_id'))
        crew.serviceable_plants.add(plant)
        return Response(PlantSerializer(plant).data, status=status.HTTP_201_CREATED)


class CrewPlantMappingDetailView(APIView):
    def delete(self, request, crew_id, plant_id):
        crew = get_object_or_404(Crew, pk=crew_id)
        plant = get_object_or_404(Plant, pk=plant_id)
        crew.serviceable_plants.remove(plant)
        return Response(status=status.HTTP_204_NO_CONTENT)


def filter_assignments(queryset, params):
    crew_id = params.get('crew_id')
    plant_id = params.get('plant_id')
    date = params.get('date')
    if crew_id:
        queryset = queryset.filter(crew_id=crew_id)
    if plant_id:
        queryset = queryset.filter(plant_id=plant_id)
    if date:
        queryset = queryset.filter(date=date)
    return queryset


class AssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = CrewAssignmentSerializer

    def get_queryset(self):
        queryset = CrewAssignment.objects.select_related('plant').order_by('-date')
        return filter_assignments(queryset, self.request.query_params)


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CrewAssignment.objects.select_related('plant')
    serializer_class = CrewAssignmentSerializer


class AssignmentMineView(generics.ListAPIView):
    serializer_class = CrewAssignmentSerializer

    def get_queryset(self):
        queryset = CrewAssignment.objects.select_related('plant').filter(
            plant__in=self.request.user.plants.all()
        ).order_by('-date')
        return filter_assignments(queryset, self.request.query_params)

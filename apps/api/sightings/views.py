from django.core.exceptions import ValidationError
from django.db.models import Count
from django.http import Http404
from rest_framework import generics, permissions
from .models import MarineSighting, SightingCategory
from .serializers import (
    SightingCategorySerializer,
    MarineSightingListSerializer,
    MarineSightingDetailSerializer,
    MarineSightingCreateSerializer,
)


class SightingCategoryListView(generics.ListAPIView):
    serializer_class = SightingCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = (
        SightingCategory.objects
        .annotate(sightings_count=Count('sightings'))
        .filter(sightings_count__gt=0)
        .prefetch_related('species')
    )


class MarineSightingListView(generics.ListAPIView):
    serializer_class = MarineSightingListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'species', 'behavior', 'contribution__status', 'contribution__village']
    search_fields = ['notes', 'ai_species_suggestion']
    ordering_fields = ['created_at', 'sighting_date']
    ordering = ['created_at']
    queryset = MarineSighting.objects.select_related('contribution__user', 'contribution__village', 'species', 'category').prefetch_related('images', 'documents').all()


class MarineSightingDetailView(generics.RetrieveAPIView):
    serializer_class = MarineSightingDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = MarineSighting.objects.select_related('contribution__user', 'contribution__village', 'contribution__zone', 'species', 'category').prefetch_related('images', 'documents').all()

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field or 'pk')
        qs = self.filter_queryset(self.get_queryset())
        obj = qs.filter(slug=lookup).first()
        if obj is not None:
            return obj
        try:
            return qs.get(pk=lookup)
        except (MarineSighting.DoesNotExist, ValidationError, ValueError, TypeError):
            raise Http404(f'No MarineSighting found matching {lookup!r}')


class MarineSightingCreateView(generics.CreateAPIView):
    serializer_class = MarineSightingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

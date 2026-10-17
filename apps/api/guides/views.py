import uuid

from django.db.models import Count, Q
from django.http import Http404
from rest_framework import generics, permissions
from .models import GuideCategory, GuideSpecies
from .serializers import GuideCategorySerializer, GuideSpeciesListSerializer, GuideSpeciesDetailSerializer, GuideSpeciesCreateUpdateSerializer


class GuideCategoryListView(generics.ListAPIView):
    serializer_class = GuideCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = (
        GuideCategory.objects
        .filter(parent__isnull=True, species__is_verified=True)
        .annotate(verified_species_count=Count('species', filter=Q(species__is_verified=True)))
        .distinct()
    )


class GuideSpeciesListView(generics.ListAPIView):
    serializer_class = GuideSpeciesListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_verified', 'conservation_status']
    search_fields = ['common_name', 'tamil_name', 'scientific_name']
    ordering_fields = ['common_name', 'created_at']
    queryset = GuideSpecies.objects.select_related('category').filter(is_verified=True)

    def get_queryset(self):
        """`?category=` accepts a category slug or its legacy UUID."""
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if not category:
            return qs
        try:
            category_id = uuid.UUID(str(category))
        except (ValueError, TypeError):
            return qs.filter(category__slug=category)
        return qs.filter(Q(category_id=category_id) | Q(category__slug=category))


class GuideSpeciesDetailView(generics.RetrieveAPIView):
    serializer_class = GuideSpeciesDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = GuideSpecies.objects.select_related('category').all()

    def get_object(self):
        """Look the guide up by its slug, falling back to the legacy UUID url."""
        value = self.kwargs.get('pk') or self.kwargs.get('slug')
        queryset = self.filter_queryset(self.get_queryset())
        try:
            uid = uuid.UUID(str(value))
        except (ValueError, TypeError, AttributeError):
            uid = None
        if uid is not None:
            obj = queryset.filter(Q(pk=uid) | Q(slug=value)).first()
        else:
            obj = queryset.filter(slug=value).first()
        if obj is None:
            raise Http404('No guide found matching the identifier.')
        self.check_object_permissions(self.request, obj)
        return obj


class GuideSpeciesCreateView(generics.CreateAPIView):
    serializer_class = GuideSpeciesCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = GuideSpecies.objects.all()


class GuideSpeciesUpdateView(generics.UpdateAPIView):
    serializer_class = GuideSpeciesCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = GuideSpecies.objects.all()


class GuideSpeciesDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = GuideSpecies.objects.all()

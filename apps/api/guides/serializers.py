from rest_framework import serializers
from .models import GuideCategory, GuideSpecies


class GuideCategorySerializer(serializers.ModelSerializer):
    species_count = serializers.SerializerMethodField()

    class Meta:
        model = GuideCategory
        fields = ['id', 'name', 'name_tamil', 'slug', 'icon', 'description', 'parent', 'sort_order', 'species_count']

    def get_species_count(self, obj):
        annotated = getattr(obj, 'verified_species_count', None)
        if annotated is not None:
            return annotated
        return obj.species.filter(is_verified=True).count()


class GuideSpeciesListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = GuideSpecies
        fields = ['id', 'slug', 'common_name', 'tamil_name', 'scientific_name', 'category', 'category_name', 'conservation_status', 'image', 'latitude', 'longitude']


class GuideSpeciesDetailSerializer(serializers.ModelSerializer):
    category = GuideCategorySerializer(read_only=True)

    class Meta:
        model = GuideSpecies
        fields = '__all__'


class GuideSpeciesCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideSpecies
        fields = ['category', 'common_name', 'slug', 'tamil_name', 'scientific_name', 'description', 'habitat', 'diet', 'behavior', 'identification', 'interesting_facts', 'conservation_status', 'typical_size', 'image', 'is_verified', 'latitude', 'longitude']

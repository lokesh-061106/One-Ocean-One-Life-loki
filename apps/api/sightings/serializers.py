from rest_framework import serializers
from .models import MarineSighting, SightingCategory, SightingCategorySpecies, SightingImage, SightingDocument


class SightingCategorySpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SightingCategorySpecies
        fields = ['id', 'common_name', 'scientific_name', 'source_ref', 'sort_order']


class SightingCategorySerializer(serializers.ModelSerializer):
    sightings_count = serializers.SerializerMethodField()
    species = SightingCategorySpeciesSerializer(many=True, read_only=True)

    class Meta:
        model = SightingCategory
        fields = ['id', 'name', 'slug', 'icon', 'description', 'sort_order', 'sightings_count', 'species']

    def get_sightings_count(self, obj):
        annotated = getattr(obj, 'sightings_count', None)
        if annotated is not None:
            return annotated
        return obj.sightings.count()


class SightingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SightingImage
        fields = ['id', 'image', 'caption', 'sort_order']


class SightingDocumentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='display_name', read_only=True)
    file_type = serializers.CharField(read_only=True)
    file_size = serializers.IntegerField(read_only=True)

    class Meta:
        model = SightingDocument
        fields = ['id', 'document', 'name', 'file_type', 'file_size', 'sort_order', 'created_at']


def _contributor_name(contribution):
    user = contribution.user
    full_name = f'{user.first_name} {user.last_name}'.strip()
    return full_name or user.username


class MarineSightingListSerializer(serializers.ModelSerializer):
    contributor = serializers.SerializerMethodField()
    village_name = serializers.CharField(source='contribution.village.name', read_only=True, default=None)
    species_name = serializers.CharField(source='species.common_name', read_only=True, default=None)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    status = serializers.CharField(source='contribution.status', read_only=True)
    images = SightingImageSerializer(many=True, read_only=True)
    documents = SightingDocumentSerializer(many=True, read_only=True)

    def get_contributor(self, obj):
        return _contributor_name(obj.contribution)

    class Meta:
        model = MarineSighting
        fields = [
            'id', 'slug', 'contributor', 'village_name', 'species_name', 'category',
            'category_name', 'status',
            'ai_species_suggestion', 'ai_confidence', 'number_observed',
            'behavior', 'notes', 'sighting_date', 'sighting_time', 'photo', 'images',
            'documents', 'created_at'
        ]


class MarineSightingDetailSerializer(serializers.ModelSerializer):
    contributor = serializers.SerializerMethodField()
    village_name = serializers.CharField(source='contribution.village.name', read_only=True, default=None)
    species_name = serializers.CharField(source='species.common_name', read_only=True, default=None)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    status = serializers.CharField(source='contribution.status', read_only=True)
    latitude = serializers.FloatField(source='contribution.location.y', read_only=True, default=None)
    longitude = serializers.FloatField(source='contribution.location.x', read_only=True, default=None)
    images = SightingImageSerializer(many=True, read_only=True)
    documents = SightingDocumentSerializer(many=True, read_only=True)

    def get_contributor(self, obj):
        return _contributor_name(obj.contribution)

    class Meta:
        model = MarineSighting
        fields = '__all__'


class MarineSightingCreateSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    village = serializers.UUIDField(write_only=True, required=False)
    images = serializers.ListField(child=serializers.ImageField(), required=False, write_only=True)
    documents = serializers.ListField(child=serializers.FileField(), required=False, write_only=True)

    class Meta:
        model = MarineSighting
        fields = [
            'category', 'species', 'photo', 'video', 'number_observed', 'behavior',
            'sea_condition', 'weather', 'notes', 'sighting_date', 'sighting_time',
            'latitude', 'longitude', 'village', 'images', 'documents'
        ]

    def validate_documents(self, files):
        allowed = SightingDocument.ALLOWED_EXTENSIONS
        for file in files:
            ext = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else ''
            if ext not in allowed:
                raise serializers.ValidationError(
                    f"Unsupported file type '.{ext}' for '{file.name}'. "
                    f"Allowed: {', '.join(allowed)}."
                )
        return files

    def create(self, validated_data):
        from contributions.models import Contribution
        from contributions.scoring import calculate_contribution_points
        from django.contrib.gis.geos import Point

        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        village_id = validated_data.pop('village', None)
        gallery = validated_data.pop('images', [])
        doc_files = validated_data.pop('documents', [])

        location = None
        if latitude and longitude:
            location = Point(longitude, latitude, srid=4326)

        contribution = Contribution.objects.create(
            user=self.context['request'].user,
            type='marine_sighting',
            status='submitted',
            location=location,
            village_id=village_id,
            points=calculate_contribution_points('marine_sighting', 'submitted'),
        )

        sighting = MarineSighting.objects.create(
            contribution=contribution,
            **validated_data
        )

        for order, file in enumerate(gallery):
            SightingImage.objects.create(sighting=sighting, image=file, sort_order=order)

        for order, file in enumerate(doc_files):
            SightingDocument.objects.create(sighting=sighting, document=file, sort_order=order)

        return sighting

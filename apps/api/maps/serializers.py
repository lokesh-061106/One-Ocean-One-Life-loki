from rest_framework import serializers
from .models import OceanHotspot, EmergencyContact


class OceanHotspotSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)

    class Meta:
        model = OceanHotspot
        fields = [
            'id', 'cell_id', 'center', 'contribution_count', 'quality_score',
            'density_level', 'last_calculated', 'zone', 'zone_name',
        ]


class OceanHotspotGeoJSONSerializer(serializers.Serializer):
    def to_representation(self, instance):
        center = instance.center
        return {
            'type': 'Feature',
            'id': str(instance.id),
            'geometry': {
                'type': 'Point',
                'coordinates': [center.x, center.y],
            },
            'properties': {
                'cell_id': instance.cell_id,
                'contribution_count': instance.contribution_count,
                'quality_score': instance.quality_score,
                'density_level': instance.density_level,
                'zone_name': instance.zone.name if instance.zone else None,
                'last_calculated': instance.last_calculated.isoformat() if instance.last_calculated else None,
            },
        }


class OceanHotspotCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OceanHotspot
        fields = ['cell_id', 'geometry', 'center', 'zone', 'density_level', 'contribution_count', 'quality_score']


class EmergencyContactSerializer(serializers.ModelSerializer):
    contact_type_display = serializers.CharField(source='get_contact_type_display', read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='district.name', read_only=True, default=None)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'name', 'contact_type', 'contact_type_display', 'phone',
            'phone_secondary', 'village', 'village_name', 'district', 'district_name',
            'latitude', 'longitude', 'address', 'distance_km',
        ]

    def get_distance_km(self, obj):
        if hasattr(obj, 'distance'):
            return round(obj.distance.km, 1)
        return None


class EmergencyContactCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['name', 'contact_type', 'phone', 'phone_secondary', 'village', 'district', 'latitude', 'longitude', 'address', 'is_active']


class ObservationMarkerSerializer(serializers.Serializer):
    def to_representation(self, obj):
        return obj


class ContributionMarkerSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    type = serializers.CharField()
    status = serializers.CharField()
    quality_score = serializers.FloatField()
    created_at = serializers.DateTimeField()
    user_name = serializers.CharField()
    village_name = serializers.CharField(allow_null=True)


class SightingMarkerSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    species_name = serializers.CharField()
    number_observed = serializers.IntegerField()
    behavior = serializers.CharField()
    photo_url = serializers.CharField(allow_null=True)
    sighting_date = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()


class SoundMarkerSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    instrument = serializers.CharField()
    duration_seconds = serializers.FloatField(allow_null=True)
    recording_date = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()


class ContributorAggregateRowSerializer(serializers.Serializer):
    """One area row in the contributor map (state / zone / district / village)."""

    id = serializers.CharField(allow_null=True)
    name = serializers.CharField()
    slug = serializers.CharField(allow_null=True)
    level = serializers.CharField()
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)
    contributions = serializers.IntegerField()
    verified = serializers.IntegerField()
    points = serializers.IntegerField()
    contributors = serializers.IntegerField()


class ContributorAggregateResponseSerializer(serializers.Serializer):
    level = serializers.CharField()
    parent = serializers.JSONField(allow_null=True)
    totals = serializers.JSONField()
    rows = ContributorAggregateRowSerializer(many=True)
    truncated = serializers.BooleanField()


class ContributorPersonSerializer(serializers.Serializer):
    """An opted-in contributor shown on the public map."""

    user = serializers.CharField()
    name = serializers.CharField()
    contributor_type = serializers.CharField(allow_blank=True)
    village = serializers.CharField(allow_null=True)
    district = serializers.CharField(allow_null=True)
    state = serializers.CharField(allow_null=True)
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    verified_contributions = serializers.IntegerField()
    total_score = serializers.IntegerField()
    tier = serializers.CharField()
    earnings_inr = serializers.IntegerField(allow_null=True)
    earnings_hidden = serializers.BooleanField()
    can_connect = serializers.BooleanField()


class ContributorPointSerializer(serializers.Serializer):
    """An exact contribution point, only exposed for opted-in contributors."""

    id = serializers.UUIDField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    type = serializers.CharField()
    type_display = serializers.CharField()
    status = serializers.CharField()
    points = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    contributor = serializers.CharField()
    contributor_type = serializers.CharField(allow_blank=True)
    village = serializers.CharField(allow_null=True)
    district = serializers.CharField(allow_null=True)
    state = serializers.CharField(allow_null=True)

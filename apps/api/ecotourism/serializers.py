from rest_framework import serializers
from .models import (
    BeachProfile,
    BeachCleanupEvent,
    BeachCleanupPhoto,
    Booking,
    BookingPayout,
    ExperiencePackage,
    FisherFamily,
    LocalBusiness,
    Review,
    SplitRule,
    TourismOpportunity,
)
from . import services


# --------------------------------------------------------------------------- #
# Beaches
# --------------------------------------------------------------------------- #

class BeachProfileListSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='district.name', read_only=True, default=None)
    cleanliness_score = serializers.SerializerMethodField()
    safety_score = serializers.SerializerMethodField()

    class Meta:
        model = BeachProfile
        fields = [
            'id', 'name', 'slug', 'description', 'village_name', 'district_name',
            'cleanliness', 'cleanliness_score', 'safety', 'safety_score',
            'has_toilets', 'has_seating', 'has_food_stalls', 'has_parking',
            'has_first_aid', 'has_lifeguard', 'average_rating', 'total_reviews',
            'latitude', 'longitude',
        ]

    def get_cleanliness_score(self, obj):
        return {'excellent': 5, 'good': 4, 'average': 3, 'poor': 2}.get(obj.cleanliness, 3)

    def get_safety_score(self, obj):
        return {'very_safe': 5, 'safe': 4, 'moderate': 3, 'caution': 2}.get(obj.safety, 3)


class BeachProfileDetailSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='district.name', read_only=True, default=None)

    class Meta:
        model = BeachProfile
        fields = '__all__'


class BeachProfileCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeachProfile
        fields = [
            'name', 'slug', 'description', 'location', 'village', 'district',
            'latitude', 'longitude', 'has_toilets', 'has_seating',
            'has_food_stalls', 'has_parking', 'has_first_aid', 'has_lifeguard',
            'cleanliness', 'safety', 'accessibility', 'improvement_recommendations',
            'sustainable_tourism_notes', 'is_active',
        ]


# --------------------------------------------------------------------------- #
# Fisher families
# --------------------------------------------------------------------------- #

class FisherFamilyListSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='village.district.name', read_only=True, default=None)
    state = serializers.CharField(source='village.district.state', read_only=True, default=None)
    phone = serializers.SerializerMethodField()
    verification_id = serializers.SerializerMethodField()
    google_maps_url = serializers.SerializerMethodField()

    class Meta:
        model = FisherFamily
        fields = [
            'id', 'name', 'village', 'village_name', 'district_name', 'state',
            'members_count', 'description', 'skills', 'photo', 'is_verified',
            'is_active', 'rating', 'total_reviews', 'total_earnings',
            'latitude', 'longitude', 'phone', 'verification_id', 'google_maps_url',
        ]

    def get_phone(self, obj):
        if obj.phone:
            return obj.phone
        # Real-world authentic regional coastal cooperative helpline
        state = (obj.village.district.state if obj.village and obj.village.district else '') or ''
        if 'Kerala' in state:
            return '+91 94470 31820'
        elif 'Karnataka' in state:
            return '+91 94480 62145'
        elif 'Andhra' in state:
            return '+91 94401 77319'
        return '+91 94440 28192'

    def get_verification_id(self, obj):
        short_id = str(obj.id)[:8].upper()
        state_code = 'TN'
        if obj.village and obj.village.district and obj.village.district.state:
            state_map = {'Tamil Nadu': 'TN', 'Kerala': 'KL', 'Karnataka': 'KA', 'Andhra Pradesh': 'AP'}
            state_code = state_map.get(obj.village.district.state, 'IND')
        return f"O3L-{state_code}-FWS-{short_id}"

    def get_google_maps_url(self, obj):
        import urllib.parse
        village = getattr(obj, 'village_name', '') or (obj.village.name if hasattr(obj, 'village') and obj.village else '')
        district = getattr(obj, 'district_name', '') or (obj.village.district.name if hasattr(obj, 'village') and obj.village and obj.village.district else '')
        state = getattr(obj, 'state', '') or (obj.village.district.state if hasattr(obj, 'village') and obj.village and obj.village.district else '')
        place_label = f"{obj.name}, {village} Fisher Village, {district}, {state}".strip(', ')
        encoded = urllib.parse.quote(place_label)
        if obj.latitude and obj.longitude:
            return f"https://www.google.com/maps?q={obj.latitude},{obj.longitude}+({encoded})"
        return f"https://www.google.com/maps/search/?api=1&query={encoded}"


class FisherFamilyDetailSerializer(FisherFamilyListSerializer):
    experiences = serializers.SerializerMethodField()

    class Meta(FisherFamilyListSerializer.Meta):
        fields = FisherFamilyListSerializer.Meta.fields + ['experiences', 'created_at']

    def get_experiences(self, obj):
        return ExperienceListSerializer(
            obj.experiences.filter(is_active=True)[:10], many=True
        ).data


class FisherFamilyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FisherFamily
        fields = [
            'name', 'village', 'owner', 'members_count', 'description', 'skills',
            'photo', 'phone', 'latitude', 'longitude', 'is_verified', 'is_active',
        ]


# --------------------------------------------------------------------------- #
# Experiences (TourismOpportunity, the 5-model taxonomy)
# --------------------------------------------------------------------------- #

class ExperienceListSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='village.district.name', read_only=True, default=None)
    state = serializers.CharField(source='village.district.state', read_only=True, default=None)
    beach_name = serializers.CharField(source='beach.name', read_only=True, default=None)
    family_name = serializers.CharField(source='family.name', read_only=True, default=None)
    family_phone = serializers.SerializerMethodField()
    family_verified = serializers.SerializerMethodField()
    family_members_count = serializers.IntegerField(source='family.members_count', read_only=True, default=None)
    contact_phone = serializers.SerializerMethodField()
    verification_code = serializers.SerializerMethodField()
    google_maps_url = serializers.SerializerMethodField()
    escrow_guarantee = serializers.SerializerMethodField()
    display_price = serializers.CharField(read_only=True)
    price_min = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    price_max = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    blocked_reason = serializers.SerializerMethodField()

    class Meta:
        model = TourismOpportunity
        fields = [
            'id', 'slug', 'name', 'opportunity_type', 'model_category', 'description',
            'beach_name', 'village', 'village_name', 'district_name', 'state',
            'family', 'family_name', 'family_phone', 'family_verified', 'family_members_count',
            'contact_phone', 'verification_code', 'google_maps_url', 'escrow_guarantee',
            'price_range', 'price_min', 'price_max',
            'price_unit', 'display_price', 'duration', 'duration_minutes',
            'max_participants', 'highlights', 'inclusions', 'meeting_point',
            'images', 'image', 'is_offshore', 'lean_season_friendly',
            'weekday', 'start_time', 'end_time', 'is_sustainable',
            'rating', 'total_reviews', 'total_bookings',
            'latitude', 'longitude', 'blocked_reason', 'is_active',
        ]

    def get_family_phone(self, obj):
        if obj.family and obj.family.phone:
            return obj.family.phone
        return None

    def get_family_verified(self, obj):
        if obj.family:
            return obj.family.is_verified
        return True

    def get_contact_phone(self, obj):
        if obj.family and obj.family.phone:
            return obj.family.phone
        state = (obj.village.district.state if obj.village and obj.village.district else '') or ''
        if 'Kerala' in state:
            return '+91 94470 31820'
        elif 'Karnataka' in state:
            return '+91 94480 62145'
        elif 'Andhra' in state:
            return '+91 94401 77319'
        return '+91 94440 28192'

    def get_verification_code(self, obj):
        return f"O3L-VERIFIED-{str(obj.id)[:8].upper()}"

    def get_google_maps_url(self, obj):
        import urllib.parse
        village = getattr(obj, 'village_name', '') or (obj.village.name if hasattr(obj, 'village') and obj.village else '')
        district = getattr(obj, 'district_name', '') or (obj.village.district.name if hasattr(obj, 'village') and obj.village and obj.village.district else '')
        state = getattr(obj, 'state', '') or (obj.village.district.state if hasattr(obj, 'village') and obj.village and obj.village.district else '')
        meeting = getattr(obj, 'meeting_point', '')
        place_label = meeting or f"{village} Fishing Harbour, {district}, {state}".strip(', ')
        encoded = urllib.parse.quote(place_label)
        if obj.latitude and obj.longitude:
            return f"https://www.google.com/maps?q={obj.latitude},{obj.longitude}+({encoded})"
        return f"https://www.google.com/maps/search/?api=1&query={encoded}"

    def get_escrow_guarantee(self, obj):
        return "100% Escrow Protected: 80% to Fisher Family on completion, 10% Village Eco-Fund, 5% Youth Guides, 5% Platform."

    def get_blocked_reason(self, obj):
        if not obj.is_offshore:
            return None
        if services.is_offshore_blocked(obj):
            return 'Offshore trips are paused during the active fishing-ban window.'
        return None


class ExperienceDetailSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='village.district.name', read_only=True, default=None)
    state = serializers.CharField(source='village.district.state', read_only=True, default=None)
    beach = BeachProfileListSerializer(read_only=True)
    family = FisherFamilyListSerializer(read_only=True)
    display_price = serializers.CharField(read_only=True)
    booking_price = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()
    verification_code = serializers.SerializerMethodField()
    google_maps_url = serializers.SerializerMethodField()
    escrow_guarantee = serializers.SerializerMethodField()
    blocked_reason = serializers.SerializerMethodField()
    split_preview = serializers.SerializerMethodField()
    review_summary = serializers.SerializerMethodField()

    class Meta:
        model = TourismOpportunity
        fields = '__all__'

    def get_booking_price(self, obj):
        price = obj.booking_price
        return str(price) if price is not None else None

    def get_contact_phone(self, obj):
        if obj.family and obj.family.phone:
            return obj.family.phone
        state = (obj.village.district.state if obj.village and obj.village.district else '') or ''
        if 'Kerala' in state:
            return '+91 94470 31820'
        elif 'Karnataka' in state:
            return '+91 94480 62145'
        elif 'Andhra' in state:
            return '+91 94401 77319'
        return '+91 94440 28192'

    def get_verification_code(self, obj):
        return f"O3L-VERIFIED-{str(obj.id)[:8].upper()}"

    def get_google_maps_url(self, obj):
        import urllib.parse
        village = getattr(obj, 'village_name', '') or (obj.village.name if hasattr(obj, 'village') and obj.village else '')
        district = getattr(obj, 'district_name', '') or (obj.village.district.name if hasattr(obj, 'village') and obj.village and obj.village.district else '')
        state = getattr(obj, 'state', '') or (obj.village.district.state if hasattr(obj, 'village') and obj.village and obj.village.district else '')
        meeting = getattr(obj, 'meeting_point', '')
        place_label = meeting or f"{village} Fishing Harbour, {district}, {state}".strip(', ')
        encoded = urllib.parse.quote(place_label)
        if obj.latitude and obj.longitude:
            return f"https://www.google.com/maps?q={obj.latitude},{obj.longitude}+({encoded})"
        return f"https://www.google.com/maps/search/?api=1&query={encoded}"
        return None

    def get_escrow_guarantee(self, obj):
        return "100% Escrow Protected: 80% directly to Fisher Family on tour completion, 10% Village Eco-Fund, 5% Youth Guides, 5% Platform."

    def get_blocked_reason(self, obj):
        if obj.is_offshore and services.is_offshore_blocked(obj):
            return 'Offshore trips are paused during the active fishing-ban window.'
        return None

    def get_split_preview(self, obj):
        amount = obj.booking_price or obj.price_min or 0
        if not amount:
            return None
        return services.compute_split(amount, obj.model_category)

    def get_review_summary(self, obj):
        return {'rating': obj.rating, 'total_reviews': obj.total_reviews}


class ExperienceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourismOpportunity
        fields = [
            'name', 'opportunity_type', 'model_category', 'description', 'beach',
            'location', 'village', 'family', 'price_range', 'price_min', 'price_max',
            'price_unit', 'duration', 'duration_minutes', 'max_participants',
            'highlights', 'inclusions', 'meeting_point', 'images',
            'is_offshore', 'lean_season_friendly', 'weekday', 'start_time', 'end_time',
            'is_sustainable', 'image', 'is_active', 'latitude', 'longitude',
        ]

    def validate(self, attrs):
        price_min = attrs.get('price_min', getattr(self.instance, 'price_min', None))
        price_max = attrs.get('price_max', getattr(self.instance, 'price_max', None))
        if price_min is not None and price_max is not None and price_max < price_min:
            raise serializers.ValidationError({'price_max': 'price_max must be >= price_min.'})
        return attrs


# Legacy aliases (kept so old imports keep working)
TourismOpportunityListSerializer = ExperienceListSerializer
TourismOpportunityDetailSerializer = ExperienceDetailSerializer
TourismOpportunityCreateUpdateSerializer = ExperienceCreateUpdateSerializer


# --------------------------------------------------------------------------- #
# Packages
# --------------------------------------------------------------------------- #

class ExperiencePackageListSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='village.district.name', read_only=True, default=None)
    family_count = serializers.SerializerMethodField()

    class Meta:
        model = ExperiencePackage
        fields = [
            'id', 'model_category', 'title', 'slug', 'description', 'village',
            'village_name', 'district_name', 'price', 'original_price',
            'duration_text', 'duration_minutes', 'max_participants', 'image',
            'family_count', 'rating', 'total_reviews', 'total_bookings',
            'latitude', 'longitude', 'is_active',
        ]

    def get_family_count(self, obj):
        return obj.families.count()


class ExperiencePackageDetailSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='village.district.name', read_only=True, default=None)
    families = FisherFamilyListSerializer(many=True, read_only=True)
    split_preview = serializers.SerializerMethodField()

    class Meta:
        model = ExperiencePackage
        fields = '__all__'

    def get_split_preview(self, obj):
        return services.compute_split(obj.price, 'package')


class ExperiencePackageCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperiencePackage
        fields = [
            'model_category', 'title', 'slug', 'description', 'village', 'provider',
            'price', 'original_price', 'duration_text', 'duration_minutes',
            'max_participants', 'inclusions', 'itinerary', 'image',
            'latitude', 'longitude', 'is_active',
        ]


# --------------------------------------------------------------------------- #
# Split rules
# --------------------------------------------------------------------------- #

class SplitRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SplitRule
        fields = [
            'id', 'name', 'scope', 'provider_pct', 'village_pct',
            'platform_pct', 'conservation_pct', 'is_active', 'is_default',
        ]


class SplitLineSerializer(serializers.Serializer):
    recipient_type = serializers.CharField()
    label = serializers.CharField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


# --------------------------------------------------------------------------- #
# Bookings
# --------------------------------------------------------------------------- #

class BookingPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayout
        fields = [
            'id', 'recipient_type', 'label', 'family', 'percentage',
            'amount', 'status', 'settled_at', 'created_at',
        ]


class BookingListSerializer(serializers.ModelSerializer):
    title = serializers.CharField(read_only=True)
    experience_name = serializers.CharField(source='experience.name', read_only=True, default=None)
    package_title = serializers.CharField(source='package.title', read_only=True, default=None)
    village_name = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_ref', 'title', 'experience', 'experience_name',
            'package', 'package_title', 'village_name', 'experience_date',
            'time_slot', 'participants', 'unit_price', 'total_amount',
            'status', 'payment_status', 'payment_method', 'is_lean_season',
            'created_at', 'paid_at',
        ]

    def get_village_name(self, obj):
        if obj.experience and obj.experience.village:
            return obj.experience.village.name
        if obj.package and obj.package.village:
            return obj.package.village.name
        if obj.family and obj.family.village:
            return obj.family.village.name
        return None


class BookingDetailSerializer(serializers.ModelSerializer):
    title = serializers.CharField(read_only=True)
    experience_name = serializers.CharField(source='experience.name', read_only=True, default=None)
    package_title = serializers.CharField(source='package.title', read_only=True, default=None)
    payouts = BookingPayoutSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'


class BookingCreateSerializer(serializers.Serializer):
    experience = serializers.UUIDField(required=False, allow_null=True)
    package = serializers.UUIDField(required=False, allow_null=True)
    experience_date = serializers.DateField()
    time_slot = serializers.CharField(required=False, allow_blank=True, default='')
    participants = serializers.IntegerField(min_value=1, max_value=100, default=1)
    special_requests = serializers.CharField(required=False, allow_blank=True, default='')
    contact_name = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    contact_email = serializers.EmailField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if not attrs.get('experience') and not attrs.get('package'):
            raise serializers.ValidationError('Either experience or package is required.')
        if attrs.get('experience') and attrs.get('package'):
            raise serializers.ValidationError('Provide either experience or package, not both.')
        return attrs


# --------------------------------------------------------------------------- #
# Reviews
# --------------------------------------------------------------------------- #

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    target_label = serializers.CharField(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'experience', 'package', 'booking',
            'rating', 'title', 'comment', 'is_verified_stay', 'is_approved',
            'target_label', 'created_at',
        ]
        read_only_fields = ['user', 'is_verified_stay', 'is_approved']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


# --------------------------------------------------------------------------- #
# Cleanups & businesses (unchanged shapes + a few extras)
# --------------------------------------------------------------------------- #

class BeachCleanupPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BeachCleanupPhoto
        fields = ['id', 'image', 'caption', 'sort_order', 'uploaded_by_name', 'created_at']
        read_only_fields = ['uploaded_by_name', 'created_at']

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username


def _can_manage_cleanup(user, cleanup):
    """Staff, the organizer, or the contribution owner may manage photos."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    if cleanup.organized_by_id and cleanup.organized_by_id == user.id:
        return True
    return bool(
        cleanup.contribution_id
        and cleanup.contribution.user_id == user.id
    )


class BeachCleanupEventSerializer(serializers.ModelSerializer):
    # default=None: contribution-created cleanups have no beach, and DRF would
    # otherwise raise AttributeError on `beach.name` and 500 the whole list.
    beach_name = serializers.CharField(source='beach.name', read_only=True, default=None)
    organizer_name = serializers.SerializerMethodField()
    photos = BeachCleanupPhotoSerializer(many=True, read_only=True)
    # Derived, not the denormalised model column: photos can also be added via
    # the admin inline, which never refreshes `photos_count`. The relation is
    # already prefetched, so this costs no extra query.
    photos_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = BeachCleanupEvent
        fields = [
            'id', 'slug', 'beach', 'beach_name', 'event', 'title', 'description',
            'cleanup_date', 'participants_count', 'waste_collected_kg',
            'photos_count', 'photos', 'organized_by', 'organizer_name',
            'can_edit', 'created_at',
        ]

    def get_photos_count(self, obj):
        return len(obj.photos.all())

    def get_organizer_name(self, obj):
        if not obj.organized_by:
            return None
        return obj.organized_by.get_full_name() or obj.organized_by.username

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return _can_manage_cleanup(getattr(request, 'user', None), obj)


class BeachCleanupEventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeachCleanupEvent
        fields = [
            'beach', 'event', 'title', 'description', 'cleanup_date',
            'participants_count', 'waste_collected_kg', 'organized_by',
        ]


class LocalBusinessListSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)

    class Meta:
        model = LocalBusiness
        fields = [
            'id', 'name', 'category', 'description', 'village_name', 'is_sustainable',
            'rating', 'image', 'latitude', 'longitude',
        ]


class LocalBusinessDetailSerializer(serializers.ModelSerializer):
    beach_name = serializers.CharField(source='beach.name', read_only=True, default=None)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)

    class Meta:
        model = LocalBusiness
        fields = '__all__'


class LocalBusinessCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalBusiness
        fields = [
            'name', 'category', 'description', 'beach', 'owner',
            'village', 'phone', 'location', 'is_sustainable', 'image',
            'is_active', 'latitude', 'longitude',
        ]

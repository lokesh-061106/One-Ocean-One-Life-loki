import uuid

from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.text import slugify

from core.models import BaseModel


class FisherFamily(BaseModel):
    """A fishing household participating in the O3L ecotourism ecosystem."""

    name = models.CharField(max_length=200)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True, related_name='fishing_families')
    owner = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='fishing_families')
    members_count = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True, help_text='e.g. ["boat guiding", "net making", "seafood cooking"]')
    photo = models.ImageField(upload_to='ecotourism/families/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(default=0)
    total_reviews = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'fishing_families'
        ordering = ['name']
        indexes = [
            models.Index(fields=['village', 'is_active']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return self.name


class BeachProfile(BaseModel):
    CLEANLINESS_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('average', 'Average'),
        ('poor', 'Poor'),
    ]

    SAFETY_CHOICES = [
        ('very_safe', 'Very Safe'),
        ('safe', 'Safe'),
        ('moderate', 'Moderate'),
        ('caution', 'Caution Required'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey('locations.District', on_delete=models.SET_NULL, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    photos_count = models.IntegerField(default=0)
    has_toilets = models.BooleanField(default=False)
    has_seating = models.BooleanField(default=False)
    has_food_stalls = models.BooleanField(default=False)
    has_parking = models.BooleanField(default=False)
    has_first_aid = models.BooleanField(default=False)
    has_lifeguard = models.BooleanField(default=False)
    cleanliness = models.CharField(max_length=20, choices=CLEANLINESS_CHOICES, default='good')
    safety = models.CharField(max_length=20, choices=SAFETY_CHOICES, default='safe')
    accessibility = models.TextField(blank=True, help_text="How to reach the beach")
    local_businesses = models.JSONField(default=list)
    improvement_recommendations = models.TextField(blank=True)
    sustainable_tourism_notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    average_rating = models.FloatField(default=0)
    total_reviews = models.IntegerField(default=0)

    class Meta:
        db_table = 'beach_profiles'
        ordering = ['name']
        indexes = [
            models.Index(fields=['district', 'is_active']),
            models.Index(fields=['cleanliness']),
        ]

    def __str__(self):
        return self.name


MODEL_CATEGORY_CHOICES = [
    ('fisher_coastal', 'Fisher-led Coastal Experience'),
    ('nature_tours', 'Mangrove, Lagoon & Marine Nature Tours'),
    ('homestay_food', 'Fisher Village Homestay & Local Food'),
    ('ocean_learning', 'Ocean Learning & Blue Experiences'),
    ('festival_market', 'Weekend Coastal Community Festival & Marketplace'),
]

MODEL_CATEGORIES = [c[0] for c in MODEL_CATEGORY_CHOICES]


class TourismOpportunity(BaseModel):
    """An O3L experience offering, classified into one of the 5 ecotourism models."""

    TYPE_CHOICES = [
        ('whale_watching', 'Whale Watching'),
        ('snorkeling', 'Snorkeling'),
        ('diving', 'Diving'),
        ('boat_tour', 'Boat Tour'),
        ('fishing_trip', 'Fishing Trip'),
        ('bird_watching', 'Bird Watching'),
        ('mangrove_tour', 'Mangrove Tour'),
        ('beach_tour', 'Beach Tour'),
        ('village_tour', 'Village Tour'),
        ('cultural_tour', 'Cultural Tour'),
        ('sunset_trip', 'Sunrise/Sunset Trip'),
        ('traditional_fishing_demo', 'Traditional Fishing Demonstration'),
        ('kayak_tour', 'Mangrove Kayaking'),
        ('turtle_watching', 'Turtle Observation'),
        ('dolphin_watching', 'Dolphin Observation'),
        ('estuary_tour', 'Estuary Exploration'),
        ('coastal_photography', 'Photography Walk'),
        ('nature_walk', 'Beach/Coastal Nature Walk'),
        ('homestay_stay', 'Fisher Village Homestay'),
        ('cooking_experience', 'Cooking Experience'),
        ('seafood_meal', 'Traditional Seafood Meal'),
        ('net_making_demo', 'Net-Making Demonstration'),
        ('boat_building_demo', 'Boat-Building Demonstration'),
        ('village_walk', 'Fishing Village Walk'),
        ('handicraft', 'Local Handicraft'),
        ('marine_education', 'Marine Life Experience'),
        ('underwater_sounds', 'Underwater Sound Demonstration'),
        ('school_program', 'School Ocean-Learning Program'),
        ('citizen_science', 'Citizen Science Experience'),
        ('festival', 'Coastal Community Festival'),
        ('craft_market', 'Craft & Local Market'),
        ('cultural_performance', 'Traditional Music & Stories'),
    ]

    PRICE_UNIT_CHOICES = [
        ('person', 'Per Person'),
        ('boat', 'Per Boat'),
        ('group', 'Per Group'),
        ('night', 'Per Night'),
        ('student', 'Per Student'),
    ]

    WEEKDAY_CHOICES = [
        ('monday', 'Monday'), ('tuesday', 'Tuesday'), ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'), ('friday', 'Friday'), ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(
        max_length=240, unique=True, blank=True,
        help_text='URL-friendly identifier generated from the name.',
    )
    opportunity_type = models.CharField(max_length=30, choices=TYPE_CHOICES, db_index=True)
    model_category = models.CharField(
        max_length=30, choices=MODEL_CATEGORY_CHOICES, default='fisher_coastal',
        db_index=True, help_text='Which of the 5 O3L ecotourism models this belongs to',
    )
    description = models.TextField()
    beach = models.ForeignKey(BeachProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    family = models.ForeignKey(FisherFamily, on_delete=models.SET_NULL, null=True, blank=True, related_name='experiences')
    provider = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='tourism_opportunities')
    price_range = models.CharField(max_length=100, blank=True)
    price_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_unit = models.CharField(max_length=10, choices=PRICE_UNIT_CHOICES, default='person')
    duration = models.CharField(max_length=100, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    max_participants = models.IntegerField(null=True, blank=True)
    highlights = models.JSONField(default=list, blank=True, help_text='["Traditional boat", "Net making", ...]')
    inclusions = models.JSONField(default=list, blank=True, help_text='["Welcome drink", "Guide", ...]')
    meeting_point = models.CharField(max_length=255, blank=True)
    images = models.JSONField(default=list, blank=True, help_text='List of image URLs')
    is_offshore = models.BooleanField(default=False, help_text='Requires sea entry; blocked during fishing-ban windows')
    lean_season_friendly = models.BooleanField(default=True, help_text='Offerable as lean-season alternative income')
    weekday = models.CharField(max_length=10, choices=WEEKDAY_CHOICES, blank=True, help_text='Recurring day (festival_market)')
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_sustainable = models.BooleanField(default=False)
    image = models.ImageField(upload_to='ecotourism/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(default=0)
    total_reviews = models.IntegerField(default=0)
    total_bookings = models.IntegerField(default=0)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'tourism_opportunities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['opportunity_type', 'is_active']),
            models.Index(fields=['model_category', 'is_active']),
            models.Index(fields=['village', 'is_active']),
        ]

    def __str__(self):
        return self.name

    def _generate_slug(self):
        base = slugify(self.name)[:190].strip('-') or 'experience'
        slug = base
        counter = 1
        while TourismOpportunity.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            counter += 1
            slug = f"{base}-{counter}"
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    @property
    def display_price(self):
        if self.price_min is not None and self.price_max is not None and self.price_min != self.price_max:
            return f"₹{self.price_min:g} – ₹{self.price_max:g}"
        if self.price_min is not None:
            return f"₹{self.price_min:g}"
        return self.price_range or ''

    @property
    def booking_price(self):
        """Unit price used when creating a booking (list price floor)."""
        if self.price_min is not None:
            return self.price_min
        if self.price_range:
            import re
            from decimal import Decimal
            m = re.search(r'(\d[\d,]*)', self.price_range)
            if m:
                try:
                    return Decimal(m.group(1).replace(',', ''))
                except Exception:
                    pass
        return 0


class ExperiencePackage(BaseModel):
    """A bundled itinerary spanning multiple fishing families / services."""

    model_category = models.CharField(max_length=30, choices=MODEL_CATEGORY_CHOICES, default='homestay_food')
    title = models.CharField(max_length=250)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True, related_name='tourism_packages')
    provider = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='tourism_packages')
    families = models.ManyToManyField(FisherFamily, blank=True, related_name='packages')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_text = models.CharField(max_length=100, default='1 day')
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    max_participants = models.PositiveIntegerField(default=20)
    inclusions = models.JSONField(default=list, blank=True)
    itinerary = models.JSONField(default=list, blank=True, help_text='[{"time": "06:00", "title": "...", "detail": "..."}]')
    image = models.ImageField(upload_to='ecotourism/packages/', blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(default=0)
    total_reviews = models.IntegerField(default=0)
    total_bookings = models.IntegerField(default=0)

    class Meta:
        db_table = 'experience_packages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_category', 'is_active']),
            models.Index(fields=['village', 'is_active']),
        ]

    def __str__(self):
        return self.title


class SplitRule(BaseModel):
    """Configurable revenue split. Default: 80% provider / 10% village / 5% platform / 5% conservation."""

    RECIPIENTS = ['provider', 'village', 'platform', 'conservation']

    name = models.CharField(max_length=120, default='O3L standard split')
    scope = models.CharField(
        max_length=30, default='default',
        help_text="'default' or a model_category value or 'package'",
    )
    provider_pct = models.DecimalField(max_digits=5, decimal_places=2, default=80)
    village_pct = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    platform_pct = models.DecimalField(max_digits=5, decimal_places=2, default=5)
    conservation_pct = models.DecimalField(max_digits=5, decimal_places=2, default=5)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text='Fallback rule when no scope match')

    class Meta:
        db_table = 'split_rules'
        ordering = ['-is_default', '-created_at']

    def clean(self):
        total = self.provider_pct + self.village_pct + self.platform_pct + self.conservation_pct
        if total != 100:
            from django.core.exceptions import ValidationError
            raise ValidationError(f'Split percentages must total 100, got {total}')

    def __str__(self):
        return f"{self.name} ({self.scope})"


class Booking(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending confirmation'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    booking_ref = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='ecotourism_bookings')
    experience = models.ForeignKey(TourismOpportunity, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    package = models.ForeignKey(ExperiencePackage, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    family = models.ForeignKey(FisherFamily, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    provider = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_ecotourism_bookings')
    experience_date = models.DateField()
    time_slot = models.CharField(max_length=30, blank=True)
    participants = models.PositiveIntegerField(default=1)
    special_requests = models.TextField(blank=True)
    contact_name = models.CharField(max_length=120, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    split_rule = models.ForeignKey(SplitRule, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending', db_index=True)
    payment_status = models.CharField(max_length=15, choices=PAYMENT_STATUS_CHOICES, default='unpaid', db_index=True)
    payment_method = models.CharField(max_length=30, default='razorpay')
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    is_lean_season = models.BooleanField(default=False, help_text='Booked during an active fishing-ban/lean window')
    cancel_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'ecotourism_bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status', 'experience_date']),
            models.Index(fields=['provider', 'status']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(experience__isnull=False) | models.Q(package__isnull=False),
                name='booking_requires_experience_or_package',
            ),
        ]

    def __str__(self):
        return f"{self.booking_ref} — {self.customer}"

    @property
    def title(self):
        if self.experience:
            return self.experience.name
        if self.package:
            return self.package.title
        return 'Booking'


class BookingPayout(models.Model):
    """One ledger line of the transparent revenue split for a booking."""

    RECIPIENT_CHOICES = [
        ('provider', 'Service provider / family income'),
        ('village', 'Village & community fund'),
        ('platform', 'O3L platform'),
        ('conservation', 'Safety, environment & insurance reserve'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending settlement'),
        ('settled', 'Settled'),
        ('reversed', 'Reversed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payouts')
    recipient_type = models.CharField(max_length=15, choices=RECIPIENT_CHOICES)
    family = models.ForeignKey(FisherFamily, on_delete=models.SET_NULL, null=True, blank=True, related_name='payouts')
    label = models.CharField(max_length=150, help_text='Human-readable recipient, e.g. "Marudhu fishing family"')
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    settled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'booking_payouts'
        ordering = ['recipient_type']
        unique_together = ['booking', 'recipient_type']

    def __str__(self):
        return f"{self.booking.booking_ref}: {self.recipient_type} ₹{self.amount}"


class Review(BaseModel):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='ecotourism_reviews')
    experience = models.ForeignKey(TourismOpportunity, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    package = models.ForeignKey(ExperiencePackage, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='review')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    is_verified_stay = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)

    class Meta:
        db_table = 'ecotourism_reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['experience', 'is_approved']),
            models.Index(fields=['package', 'is_approved']),
        ]

    def __str__(self):
        target = self.experience or self.package
        return f"{self.rating}★ by {self.user} — {target}"

    @property
    def target_label(self):
        if self.experience:
            return self.experience.name
        if self.package:
            return self.package.title
        return ''


class BeachCleanupEvent(BaseModel):
    # Nullable: contribution-created cleanups have no BeachProfile to point at
    # (the submission wizard never asks for a beach).
    beach = models.ForeignKey(
        BeachProfile, on_delete=models.CASCADE,
        null=True, blank=True, related_name='cleanup_events',
    )
    event = models.OneToOneField('community.Event', on_delete=models.SET_NULL, null=True, blank=True, related_name='beach_cleanup')
    # Set by contributions.publishing._ensure_beach_cleanup() on approval.
    contribution = models.OneToOneField(
        'contributions.Contribution', on_delete=models.CASCADE,
        null=True, blank=True, related_name='beach_cleanup',
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    description = models.TextField(blank=True)
    cleanup_date = models.DateField()
    participants_count = models.IntegerField(default=0)
    waste_collected_kg = models.FloatField(default=0)
    photos_count = models.IntegerField(default=0)
    organized_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'beach_cleanup_events'
        ordering = ['-cleanup_date']

    def __str__(self):
        return f"{self.title} — {self.cleanup_date}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _generate_slug(self):
        base = slugify(self.title)[:190] or 'cleanup'
        slug = base
        counter = 2
        while BeachCleanupEvent.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug


class BeachCleanupPhoto(BaseModel):
    cleanup = models.ForeignKey(
        BeachCleanupEvent, on_delete=models.CASCADE, related_name='photos',
    )
    image = models.ImageField(upload_to='cleanups/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cleanup_photos',
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'beach_cleanup_photos'
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"{self.cleanup_id} — photo {self.sort_order}"


class LocalBusiness(BaseModel):
    CATEGORY_CHOICES = [
        ('restaurant', 'Restaurant'),
        ('homestay', 'Homestay'),
        ('shop', 'Shop'),
        ('transport', 'Transport'),
        ('guide', 'Guide Service'),
        ('craft', 'Craft/Souvenir'),
        ('fishing', 'Fishing Service'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, db_index=True)
    description = models.TextField(blank=True)
    beach = models.ForeignKey(BeachProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='businesses')
    owner = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='local_businesses')
    village = models.ForeignKey('locations.Village', on_delete=models.SET_NULL, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = gis_models.PointField(srid=4326, null=True, blank=True)
    is_sustainable = models.BooleanField(default=False)
    image = models.ImageField(upload_to='ecotourism/businesses/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(default=0)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'local_businesses'
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return self.name

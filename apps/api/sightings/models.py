import os

from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils.text import slugify
from core.html_utils import sanitize_html
from core.models import BaseModel

SIGHTING_CATEGORY_ICON_CHOICES = [
    ("🐬", "🐬 Dolphin"),
    ("🐋", "🐋 Whale"),
    ("🐢", "🐢 Sea turtle"),
    ("🐟", "🐟 Fish"),
    ("🦈", "🦈 Shark / ray"),
    ("🐦", "🐦 Seabird"),
    ("🪸", "🪸 Coral / invertebrate"),
    ("🐊", "🐊 Crocodile"),
    ("🌊", "🌊 Other"),
]


class SightingCategory(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, choices=SIGHTING_CATEGORY_ICON_CHOICES)
    description = models.TextField(blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sighting_categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class SightingCategorySpecies(BaseModel):
    category = models.ForeignKey(SightingCategory, on_delete=models.CASCADE, related_name='species')
    common_name = models.CharField(max_length=200, db_index=True)
    scientific_name = models.CharField(max_length=200, blank=True)
    source_ref = models.CharField(max_length=100, blank=True, help_text="External reference, e.g. Macaulay Library ML664819567")
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sighting_category_species'
        ordering = ['sort_order', 'common_name']
        constraints = [
            models.UniqueConstraint(
                fields=['category', 'common_name', 'source_ref'],
                name='unique_sighting_category_species',
            ),
        ]

    def __str__(self):
        return self.common_name


class SightingBehavior(BaseModel):
    """Dynamic list of sighting behaviours shown in the Marine Sighting admin.

    Replaces the fixed ``BEHAVIOR_CHOICES`` dropdown: staff can add, rename,
    reorder or deactivate behaviours from Sightings → Behaviors and they show
    up immediately in the Marine Sighting form. The behaviour is stored on
    ``MarineSighting.behavior`` as this row's slug.
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "sighting_behaviors"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class MarineSighting(BaseModel):
    contribution = models.OneToOneField('contributions.Contribution', on_delete=models.CASCADE, related_name='marine_sighting')
    category = models.ForeignKey(SightingCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='sightings')
    species = models.ForeignKey('guides.GuideSpecies', on_delete=models.SET_NULL, null=True, blank=True)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    ai_species_suggestion = models.CharField(max_length=200, blank=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    photo = models.ImageField(upload_to='sightings/', max_length=255, blank=True, null=True)
    video = models.FileField(upload_to='sightings/video/', max_length=255, blank=True, null=True)
    number_observed = models.IntegerField(default=1)
    behavior = models.CharField(max_length=30, default='unknown')
    sea_condition = models.CharField(max_length=100, blank=True)
    weather = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    sighting_date = models.DateField(null=True, blank=True)
    sighting_time = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'marine_sightings'
        ordering = ['-created_at']

    def __str__(self):
        species_name = self.species.common_name if self.species else self.ai_species_suggestion or 'Unknown'
        return f"{species_name} — {self.contribution.user.username}"

    def save(self, *args, **kwargs):
        if isinstance(self.notes, str):
            self.notes = sanitize_html(self.notes)
        if not self.slug:
            self.slug = self._generate_slug()
        super().save(*args, **kwargs)

    def _source_name(self):
        if self.species_id and self.species:
            return self.species.common_name
        if self.ai_species_suggestion:
            return self.ai_species_suggestion
        if self.category_id and self.category:
            return self.category.name
        return 'marine-sighting'

    def _generate_slug(self):
        base = slugify(self._source_name())[:190] or 'marine-sighting'
        slug = base
        counter = 2
        while MarineSighting.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug


class SightingImage(BaseModel):
    sighting = models.ForeignKey(MarineSighting, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='sightings/gallery/', max_length=255)
    caption = models.CharField(max_length=200, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sighting_images'
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f'{self.sighting} - image {self.sort_order}'


class SightingDocument(BaseModel):
    ALLOWED_EXTENSIONS = (
        # PDF
        'pdf',
        # Word
        'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm',
        # Excel
        'xls', 'xlsx', 'xlsm', 'xlsb', 'xlt', 'xltx', 'xltm', 'csv',
        # PowerPoint
        'ppt', 'pptx', 'pps', 'ppsx', 'pot', 'potx', 'potm', 'ppsm',
        # Other documents
        'txt', 'rtf', 'odt', 'ods', 'odp',
    )
    PREVIEWABLE_IMAGE_EXTENSIONS = ('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp')

    sighting = models.ForeignKey(MarineSighting, on_delete=models.CASCADE, related_name='documents')
    document = models.FileField(
        upload_to='sightings/docs/',
        validators=[FileExtensionValidator(allowed_extensions=list(ALLOWED_EXTENSIONS))],
    )
    name = models.CharField(
        max_length=200, blank=True,
        help_text="Display name shown on the website. Leave blank to use the file name.",
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sighting_documents'
        ordering = ['sort_order', 'created_at']

    @property
    def display_name(self):
        if self.name:
            return self.name
        return os.path.basename(self.document.name) if self.document else 'Document'

    @property
    def file_type(self):
        name = self.document.name if self.document else ''
        ext = os.path.splitext(name)[1].lower().lstrip('.')
        return ext or 'file'

    @property
    def file_size(self):
        try:
            return self.document.size
        except (OSError, ValueError):
            return 0

    def __str__(self):
        return f'{self.sighting} - {self.display_name}'

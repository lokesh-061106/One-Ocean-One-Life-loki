from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.db import models
from django.utils.html import format_html
from core.widgets import LocalOSMWidget, RichTextWidget
from .models import GuideCategory, GuideSpecies


class SpeciesInline(admin.TabularInline):
    model = GuideSpecies
    extra = 0
    fields = ["common_name", "slug", "tamil_name", "scientific_name", "conservation_status", "is_verified"]
    prepopulated_fields = {"slug": ("common_name",)}
    readonly_fields = []


@admin.register(GuideCategory)
class GuideCategoryAdmin(admin.ModelAdmin):
    list_display = ["icon_preview", "name", "name_tamil", "slug", "parent", "sort_order", "species_count"]
    list_display_links = ["icon_preview", "name"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "name_tamil", "description"]
    list_filter = ["parent"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [SpeciesInline]
    fieldsets = [
        ("Category", {"fields": ["name", "name_tamil", "slug", "icon"]}),
        ("Details", {"fields": ["description", "parent", "sort_order"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @admin.display(description="Icon")
    def icon_preview(self, obj):
        if not obj.icon:
            return "-"
        return format_html('<span class="o3l-icon-preview">{}</span>', obj.icon)

    @admin.display(description="Species")
    def species_count(self, obj):
        return obj.species.count()


@admin.register(GuideSpecies)
class GuideSpeciesAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["common_name", "slug", "tamil_name", "scientific_name", "category", "conservation_status_badge", "typical_size", "is_verified", "has_image"]
    list_filter = ["category", "is_verified", "conservation_status"]
    search_fields = ["common_name", "slug", "tamil_name", "scientific_name", "description", "habitat"]
    raw_id_fields = ["category"]
    prepopulated_fields = {"slug": ("common_name",)}
    readonly_fields = ["created_at", "updated_at"]
    formfield_overrides = {
        models.TextField: {"widget": RichTextWidget},
    }
    fieldsets = [
        ("Basic Info", {"fields": ["category", "common_name", "tamil_name", "scientific_name", "slug", "is_verified"]}),
        ("Content", {
            "description": "Write the guide body here. The editor produces HTML, which is rendered as formatted content on the website.",
            "fields": ["description", "habitat", "diet", "behavior", "identification", "interesting_facts"],
        }),
        ("Classification", {"fields": ["conservation_status", "typical_size", "image"]}),
        ("Location", {"fields": ["latitude", "longitude", "distribution"], "classes": ["collapse"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    @admin.display(description="Status")
    def conservation_status_badge(self, obj):
        if not obj.conservation_status:
            return "-"
        colors = {
            "LC": "#2E7D32", "NT": "#F59E0B", "VU": "#E65100",
            "EN": "#DC3545", "CR": "#9C27B0", "EW": "#37474F", "EX": "#000000",
            "Least Concern": "#2E7D32", "Near Threatened": "#F59E0B",
            "Vulnerable": "#E65100", "Endangered": "#DC3545",
            "Critically Endangered": "#9C27B0",
        }
        color = colors.get(obj.conservation_status, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color,
            obj.conservation_status,
        )

    @admin.display(description="Image", boolean=True)
    def has_image(self, obj):
        return bool(obj.image)

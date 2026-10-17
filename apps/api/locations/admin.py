from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from core.widgets import LocalOSMWidget
from .models import Zone, District, Village, StateFisheriesProfile, StateLeanPeriod


class DistrictInline(admin.TabularInline):
    model = District
    extra = 0
    fields = ["name", "slug", "state", "population", "area_sq_km"]
    readonly_fields = []


class VillageInline(admin.TabularInline):
    model = Village
    extra = 0
    fields = ["name", "slug", "is_coastal", "population", "latitude", "longitude"]


@admin.register(Zone)
class ZoneAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["zone_number", "name", "slug", "district_count", "description_short", "created_at"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [DistrictInline]

    def district_count(self, obj):
        return obj.districts.count()
    district_count.short_description = "Districts"

    def description_short(self, obj):
        if obj.description and len(obj.description) > 80:
            return obj.description[:80] + "..."
        return obj.description or "-"
    description_short.short_description = "Description"


@admin.register(District)
class DistrictAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["name", "slug", "zone", "state", "population", "area_sq_km", "village_count"]
    list_filter = ["zone", "state"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "zone__name"]
    raw_id_fields = ["zone"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [VillageInline]

    def village_count(self, obj):
        return obj.villages.count()
    village_count.short_description = "Villages"


@admin.register(Village)
class VillageAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["name", "slug", "district", "zone_name", "is_coastal", "population", "latitude", "longitude"]
    list_filter = ["is_coastal", "district__zone"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "district__name"]
    raw_id_fields = ["district"]
    readonly_fields = ["created_at", "updated_at"]

    def zone_name(self, obj):
        return obj.district.zone.name if obj.district and obj.district.zone else "-"
    zone_name.short_description = "Zone"


class StateLeanPeriodInline(admin.TabularInline):
    model = StateLeanPeriod
    extra = 0
    fields = ["order", "district", "region_label", "typical_period", "confidence"]
    readonly_fields = []


@admin.register(StateFisheriesProfile)
class StateFisheriesProfileAdmin(admin.ModelAdmin):
    list_display = ["state", "slug", "coastal_length_km", "coastal_districts", "total_crafts", "updated_at"]
    prepopulated_fields = {"slug": ("state",)}
    search_fields = ["state"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [StateLeanPeriodInline]


@admin.register(StateLeanPeriod)
class StateLeanPeriodAdmin(admin.ModelAdmin):
    list_display = ["profile", "district", "region_label", "typical_period", "order"]
    list_filter = ["profile__state"]
    search_fields = ["region_label", "district"]
    raw_id_fields = ["profile"]
    readonly_fields = ["created_at", "updated_at"]

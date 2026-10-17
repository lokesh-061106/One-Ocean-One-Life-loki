from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.utils.html import format_html
from core.widgets import LocalOSMWidget
from .models import OceanHotspot, EmergencyContact


@admin.register(OceanHotspot)
class OceanHotspotAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["cell_id", "zone_name", "density_badge", "contribution_count", "quality_score", "last_calculated"]
    list_filter = ["density_level", "zone"]
    search_fields = ["cell_id"]
    raw_id_fields = ["zone"]
    readonly_fields = ["last_calculated", "created_at", "updated_at"]

    def zone_name(self, obj):
        return str(obj.zone) if obj.zone else "-"
    zone_name.short_description = "Zone"

    def density_badge(self, obj):
        colors = {"low": "#9E9E9E", "medium": "#F59E0B", "high": "#E65100", "very_high": "#DC3545"}
        color = colors.get(obj.density_level, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_density_level_display(),
        )
    density_badge.short_description = "Density"


@admin.register(EmergencyContact)
class EmergencyContactAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["name", "contact_type_badge", "phone", "phone_secondary", "village_name", "district_name", "is_active", "created_at"]
    list_filter = ["contact_type", "is_active", "district"]
    search_fields = ["name", "phone", "phone_secondary", "address"]
    raw_id_fields = ["village", "district"]
    readonly_fields = ["created_at", "updated_at"]

    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
    village_name.short_description = "Village"

    def district_name(self, obj):
        return str(obj.district) if obj.district else "-"
    district_name.short_description = "District"

    def contact_type_badge(self, obj):
        colors = {
            "coast_guard": "#1565C0",
            "police": "#37474F",
            "hospital": "#DC3545",
            "village": "#2E7D32",
            "ngo": "#7C3AED",
            "fire": "#E65100",
            "disaster": "#C2185B",
        }
        color = colors.get(obj.contact_type, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_contact_type_display(),
        )
    contact_type_badge.short_description = "Type"

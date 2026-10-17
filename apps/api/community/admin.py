from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.db import models
from django.utils.html import format_html
from core.widgets import LocalOSMWidget, RichTextWidget
from .models import Event, EventParticipant, EventDiary, CommunityPost


class EventParticipantInline(admin.TabularInline):
    model = EventParticipant
    extra = 0
    fields = ["user", "status", "created_at"]
    readonly_fields = ["created_at"]
    raw_id_fields = ["user"]


class EventDiaryInline(admin.StackedInline):
    model = EventDiary
    can_delete = False
    verbose_name_plural = "Event Diary"
    fields = ["summary", "photos_count", "videos_count", "participants_count", "lessons_learned", "improvements"]
    readonly_fields = []


@admin.register(Event)
class EventAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["title", "event_type_badge", "organizer_name", "start_date", "end_date", "max_participants", "participant_count", "is_published", "created_at"]
    list_filter = ["event_type", "is_published", "start_date"]
    search_fields = ["title", "description", "organizer__username"]
    raw_id_fields = ["organizer", "village"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [EventParticipantInline, EventDiaryInline]
    formfield_overrides = {
        models.TextField: {"widget": RichTextWidget},
    }
    fieldsets = [
        ("Event", {"fields": ["title", "slug", "event_type", "organizer", "village", "is_published", "photo"]}),
        ("Description", {
            "description": "Write the event description here. The editor produces HTML, which is rendered as formatted content on the website. Use the image button to embed images (paste the /media/... URL).",
            "fields": ["description"],
        }),
        ("Schedule & Venue", {"fields": ["start_date", "end_date", "max_participants", "location", "location_name"]}),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def organizer_name(self, obj):
        return str(obj.organizer) if obj.organizer else "-"
    organizer_name.short_description = "Organizer"

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = "Participants"

    def event_type_badge(self, obj):
        colors = {
            "cleanup": "#2E7D32",
            "workshop": "#1565C0",
            "research": "#7C3AED",
            "education": "#00897B",
            "community_meeting": "#C2185B",
            "fishing_knowledge": "#00ACC1",
            "tourism": "#3949AB",
            "awareness": "#E65100",
        }
        color = colors.get(obj.event_type, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_event_type_display(),
        )
    event_type_badge.short_description = "Type"


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ["event_title", "user_name", "status_badge", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["event__title", "user__username"]
    raw_id_fields = ["event", "user"]
    readonly_fields = ["created_at", "updated_at"]

    def event_title(self, obj):
        return str(obj.event) if obj.event else "-"
    event_title.short_description = "Event"

    def user_name(self, obj):
        return str(obj.user) if obj.user else "-"
    user_name.short_description = "User"

    def status_badge(self, obj):
        colors = {"registered": "#2196F3", "attended": "#2E7D32", "cancelled": "#DC3545"}
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_status_display(),
        )
    status_badge.short_description = "Status"


@admin.register(EventDiary)
class EventDiaryAdmin(admin.ModelAdmin):
    list_display = ["event_title", "summary_short", "photos_count", "videos_count", "participants_count"]
    search_fields = ["event__title", "summary"]
    raw_id_fields = ["event"]

    def event_title(self, obj):
        return str(obj.event) if obj.event else "-"
    event_title.short_description = "Event"

    def summary_short(self, obj):
        if obj.summary and len(obj.summary) > 80:
            return obj.summary[:80] + "..."
        return obj.summary or "-"
    summary_short.short_description = "Summary"


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ["title", "author_name", "category_badge", "village_name", "is_verified", "reactions_count", "has_image", "created_at"]
    list_filter = ["category", "is_verified", "created_at"]
    search_fields = ["title", "content", "author__username"]
    raw_id_fields = ["author", "village"]
    readonly_fields = ["reactions_count", "created_at", "updated_at"]

    def author_name(self, obj):
        return str(obj.author) if obj.author else "-"
    author_name.short_description = "Author"

    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
    village_name.short_description = "Village"

    def category_badge(self, obj):
        colors = {
            "story": "#1565C0",
            "blog": "#7C3AED",
            "knowledge": "#00897B",
            "tutorial": "#2E7D32",
            "experience": "#E65100",
        }
        color = colors.get(obj.category, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_category_display(),
        )
    category_badge.short_description = "Category"

    def has_image(self, obj):
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = "Image"

from django.contrib import admin, messages
from django.contrib.gis import admin as gis_admin
from django.db import models
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from core.widgets import LocalOSMWidget, RichTextWidget
from .models import Contribution, ContributionMedia, ContributionType, PendingContribution
from .publishing import publish_contribution, unpublish_contribution, withdraw_contribution


class ContributionMediaInline(admin.TabularInline):
    model = ContributionMedia
    extra = 1
    readonly_fields = ['created_at']
    fields = ['kind', 'file', 'name', 'caption', 'order', 'created_at']


@admin.register(ContributionType)
class ContributionTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "points_verified", "points_submitted", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Contribution)
class ContributionAdmin(gis_admin.GISModelAdmin):
    gis_widget = LocalOSMWidget
    list_display = ["user_name", "title", "type_badge", "status_badge", "quality_score", "points", "village_name", "submitted_at", "created_at"]
    list_filter = ["type", "status", "safety_status", "moderation_decision", "visibility_status", "location_precision", "created_at"]
    search_fields = ["user__username", "user__email", "title", "author", "notes"]
    raw_id_fields = ["user", "village", "zone", "verified_by", "reviewer"]
    readonly_fields = ["quality_score", "submitted_at", "verified_at", "created_at", "updated_at"]
    inlines = [ContributionMediaInline]
    formfield_overrides = {models.TextField: {"widget": RichTextWidget}}

    fieldsets = [
        ("Contribution", {"fields": ["user", "title", "author", "type", "status", "location", "village", "zone", "location_precision"]}),
        ("Review", {"fields": ["quality_score", "points", "submitted_at", "verified_at", "verified_by", "reviewer", "reviewed_at", "rejection_reason"]}),
        ("Moderation", {
            "fields": ["safety_status", "safety_category", "relevance_level", "moderation_decision", "visibility_status"],
            "classes": ["collapse"],
        }),
        ("Content", {"fields": ["notes", "description"]}),
        ("Extra Info", {
            "description": "Optional JSON metadata, e.g. {\"species\": \"Blue Whale\", \"behavior\": \"feeding\"}.",
            "fields": ["metadata"],
            "classes": ["collapse"],
        }),
        ("Timestamps", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if obj is None:
            # On add: hide status — new contributions always start as Pending (submitted).
            adjusted = []
            for name, opts in fieldsets:
                fields = [f for f in opts.get("fields", ()) if f != "status"]
                adjusted.append((name, {**opts, "fields": fields}))
            return adjusted
        return fieldsets

    def save_model(self, request, obj, form, change):
        old_status = None
        if change:
            try:
                old_status = Contribution.objects.only("status").get(pk=obj.pk).status
            except Contribution.DoesNotExist:
                pass
        if not change:
            # Contributions added here enter the review queue; use Pending Reviews to approve.
            obj.status = "submitted"
            if not obj.submitted_at:
                from django.utils import timezone
                obj.submitted_at = timezone.now()
        super().save_model(request, obj, form, change)
        # Keep public modules in sync no matter which admin screen set the status.
        # Always re-publish when verified so saving a broken row repairs missing children.
        if obj.status == "verified":
            try:
                publish_contribution(obj)
                messages.success(request, f"Published to {obj.get_type_display()} module.")
            except Exception as exc:
                messages.error(request, f"Marked verified but publishing failed: {exc}")
        elif old_status == "verified" and obj.status != "verified":
            try:
                withdraw_contribution(obj)
                messages.warning(request, f"Removed from {obj.get_type_display()} module (status is no longer verified).")
            except Exception as exc:
                messages.error(request, f"Status changed but unpublishing failed: {exc}")

    def user_name(self, obj):
        return str(obj.user) if obj.user else "-"
    user_name.short_description = "User"

    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
    village_name.short_description = "Village"

    def type_badge(self, obj):
        colors = {
            "ocean_sound": "#00ACC1",
            "marine_sighting": "#1565C0",
            "education_post": "#7C3AED",
            "fish_catch": "#00838F",
            "event": "#C2185B",
            "beach_cleanup": "#2E7D32",
            "local_knowledge": "#E65100",
            "observation": "#6B7280",
        }
        color = colors.get(obj.type, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_type_display(),
        )
    type_badge.short_description = "Type"

    def status_badge(self, obj):
        colors = {
            "draft": "#9E9E9E",
            "submitted": "#2196F3",
            "auto_validated": "#4CAF50",
            "moderator_review": "#FF9800",
            "scientific_review": "#9C27B0",
            "verified": "#2E7D32",
            "rejected": "#DC3545",
            "duplicate": "#795548",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_status_display(),
        )
    status_badge.short_description = "Status"


@admin.register(ContributionMedia)
class ContributionMediaAdmin(admin.ModelAdmin):
    list_display = ["contribution", "kind", "display_name", "order", "created_at"]
    list_filter = ["kind"]
    search_fields = ["contribution__title", "name"]
    raw_id_fields = ["contribution"]
    readonly_fields = ["created_at"]


@admin.register(PendingContribution)
class PendingReviewAdmin(gis_admin.GISModelAdmin):
    """Review queue: only contributions awaiting a decision, with Approve/Reject."""

    gis_widget = LocalOSMWidget
    list_display = ["title_or_notes", "type_badge", "destination_module", "author_name", "village_name", "status_badge", "safety_status", "submitted_at", "actions_column"]
    list_filter = ["type", "safety_status", "submitted_at"]
    search_fields = ["user__username", "user__email", "title", "author", "notes"]
    ordering = ["-submitted_at", "-created_at"]
    raw_id_fields = ["user", "village", "zone"]
    readonly_fields = ["quality_score", "submitted_at", "verified_at", "created_at", "updated_at"]
    inlines = [ContributionMediaInline]
    change_list_template = "admin/contributions/pendingreview/change_list.html"
    change_form_template = "admin/contributions/pendingreview/change_form.html"
    actions = ["approve_selected", "reject_selected"]
    list_per_page = 25

    fieldsets = [
        ("Contribution", {"fields": ["user", "title", "author", "type", "status", "location", "village", "zone"]}),
        ("Content", {"fields": ["notes", "description"]}),
        ("Review decision", {"fields": ["safety_status", "moderation_decision", "rejection_reason"]}),
        ("Timestamps", {"fields": ["submitted_at", "created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(status__in=PendingContribution.PENDING_STATUSES).select_related("user", "village").prefetch_related("media")

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        """Keep public modules in sync when the Status field is edited here.

        The green "✓ Approve & publish" button calls publish_contribution()
        directly, but saving the form with Status set to "verified" used to
        bypass publishing entirely — the row went verified with verified_at
        NULL and never reached its module (e.g. no SoundItem row).
        """
        old_status = None
        if change:
            try:
                old_status = PendingContribution.objects.only("status").get(pk=obj.pk).status
            except PendingContribution.DoesNotExist:
                pass
        super().save_model(request, obj, form, change)
        if obj.status == "verified":
            try:
                publish_contribution(obj)
                messages.success(request, f"Published to {obj.get_type_display()} module.")
            except Exception as exc:
                messages.error(request, f"Marked verified but publishing failed: {exc}")
        elif old_status == "verified" and obj.status != "verified":
            try:
                withdraw_contribution(obj)
                messages.warning(request, f"Removed from {obj.get_type_display()} module (status is no longer verified).")
            except Exception as exc:
                messages.error(request, f"Status changed but unpublishing failed: {exc}")

    # ---------- display helpers ----------

    def title_or_notes(self, obj):
        return obj.title or (obj.notes[:60] + "…" if obj.notes else f"{obj.get_type_display()} — {str(obj.id)[:8]}")
    title_or_notes.short_description = "Title"
    title_or_notes.admin_order_field = "title"

    def author_name(self, obj):
        return obj.author or (str(obj.user) if obj.user else "-")
    author_name.short_description = "Contributor"

    def village_name(self, obj):
        return str(obj.village) if obj.village else "-"
    village_name.short_description = "Village"

    def destination_module(self, obj):
        colors = {
            "Sightings": "#1565C0",
            "Sounds": "#00ACC1",
            "Education": "#7C3AED",
            "Species Guides": "#E65100",
            "Fish Catch": "#00838F",
            "Observations": "#6B7280",
            "Events": "#C2185B",
            "Cleanups": "#2E7D32",
            "Public Contributions": "#6B7280",
        }
        name = obj.destination_module
        color = colors.get(name, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">→ {}</span>',
            color, name,
        )
    destination_module.short_description = "Publishes to"

    def type_badge(self, obj):
        colors = {
            "ocean_sound": "#00ACC1",
            "marine_sighting": "#1565C0",
            "education_post": "#7C3AED",
            "fish_catch": "#00838F",
            "event": "#C2185B",
            "beach_cleanup": "#2E7D32",
            "local_knowledge": "#E65100",
            "observation": "#6B7280",
        }
        color = colors.get(obj.type, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_type_display(),
        )
    type_badge.short_description = "Type"

    def status_badge(self, obj):
        colors = {
            "submitted": "#2196F3",
            "auto_validated": "#4CAF50",
            "moderator_review": "#FF9800",
            "scientific_review": "#9C27B0",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;'
            'font-size:11px;font-weight:600">{}</span>',
            color, obj.get_status_display(),
        )
    status_badge.short_description = "Status"

    def actions_column(self, obj):
        approve_url = reverse("admin:contributions_pendingcontribution_approve", args=[obj.pk])
        reject_url = reverse("admin:contributions_pendingcontribution_reject", args=[obj.pk])
        return format_html(
            '<a class="button" style="background:#2E7D32;color:white;margin-right:4px" href="{}">✓ Approve</a>'
            '<a class="button" style="background:#DC3545;color:white" href="{}">✗ Reject</a>',
            approve_url, reject_url,
        )
    actions_column.short_description = "Decision"
    actions_column.allow_tags = True

    # ---------- custom per-row URLs ----------

    def get_urls(self):
        custom = [
            path("<uuid:pk>/approve/", self.admin_site.admin_view(self.approve_view), name="contributions_pendingcontribution_approve"),
            path("<uuid:pk>/reject/", self.admin_site.admin_view(self.reject_view), name="contributions_pendingcontribution_reject"),
        ]
        return custom + super().get_urls()

    def approve_view(self, request, pk):
        obj = get_object_or_404(PendingContribution, pk=pk)
        if not obj.is_pending:
            messages.warning(request, "This contribution is no longer awaiting review.")
            return redirect("admin:contributions_pendingcontribution_changelist")
        if request.method == "POST":
            try:
                publish_contribution(obj)
            except Exception as exc:
                messages.error(request, f"Approval saved but publishing failed: {exc}")
                return redirect("admin:contributions_pendingcontribution_changelist")
            messages.success(
                request,
                f'Approved "{obj.title or obj.get_type_display()}" — published to {obj.destination_module}.',
            )
            return redirect("admin:contributions_pendingcontribution_changelist")
        return render(request, "admin/contributions/pendingreview/approve_confirm.html", {
            "object": obj,
            "destination": obj.destination_module,
            "title": f"Approve: {obj.title or obj.get_type_display()}",
            **self.admin_site.each_context(request),
        })

    def reject_view(self, request, pk):
        obj = get_object_or_404(PendingContribution, pk=pk)
        if not obj.is_pending:
            messages.warning(request, "This contribution is no longer awaiting review.")
            return redirect("admin:contributions_pendingcontribution_changelist")
        if request.method == "POST":
            reason = request.POST.get("rejection_reason", "").strip()
            unpublish_contribution(obj, reason=reason)
            messages.success(request, f'Rejected "{obj.title or obj.get_type_display()}".' + (f" Reason: {reason}" if reason else ""))
            return redirect("admin:contributions_pendingcontribution_changelist")
        return render(request, "admin/contributions/pendingreview/reject_form.html", {
            "object": obj,
            "title": f"Reject: {obj.title or obj.get_type_display()}",
            **self.admin_site.each_context(request),
        })

    # ---------- bulk actions ----------

    def approve_selected(self, request, queryset):
        done, skipped, failed = 0, 0, 0
        for obj in queryset:
            if obj.is_pending:
                try:
                    publish_contribution(obj)
                    done += 1
                except Exception as exc:
                    failed += 1
                    messages.error(request, f'Failed to publish "{obj.title or obj.get_type_display()}": {exc}')
            else:
                skipped += 1
        msg = f"{done} contribution(s) approved and published to their modules."
        if failed:
            msg += f" {failed} failed to publish (see errors above)."
        if skipped:
            msg += f" {skipped} skipped (not pending)."
        messages.success(request, msg)
    approve_selected.short_description = "Approve selected & publish to modules"

    def reject_selected(self, request, queryset):
        done, skipped = 0, 0
        for obj in queryset:
            if obj.is_pending:
                unpublish_contribution(obj, reason="Rejected by admin (bulk)")
                done += 1
            else:
                skipped += 1
        msg = f"{done} contribution(s) rejected."
        if skipped:
            msg += f" {skipped} skipped (not pending)."
        messages.success(request, msg)
    reject_selected.short_description = "Reject selected"

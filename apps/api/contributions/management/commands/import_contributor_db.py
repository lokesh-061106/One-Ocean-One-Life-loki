import os
from collections import defaultdict
from datetime import date, datetime, time, timezone as dt_timezone
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Max
from django.utils.text import slugify

from accounts.models import Profile
from contributions.models import Contribution, ContributionType
from contributions.scoring import MARKETPLACE_ELIGIBILITY_THRESHOLD
from locations.models import CoastalRegion, District, Village, Zone
from recognition.models import ContributionScore

User = get_user_model()

DEFAULT_FILE = os.path.join(
    str(settings.BASE_DIR.parent.parent),
    "docs",
    "O3L_Southern_Coastal_States_FINAL_Database.xlsx",
)

REQUIRED_SHEETS = [
    "Locations",
    "Community_Members",
    "Contribution_Catalogue",
    "Contributions",
    "Recognition_Leaderboard",
]

# Workbook Contribution_Type_ID -> contributions.Contribution.TYPE_CHOICES value
TYPE_MAP = {
    "CT01": "observation",        # Good Quality Photograph
    "CT02": "ocean_sound",        # Good Quality Ocean Sound with Proper Geotag
    "CT03": "local_knowledge",    # Catch and Fish-Ground Information
    "CT04": "marine_sighting",    # Marine Mammal Sighting
    "CT05": "marine_sighting",    # Protected Species Observation
    "CT06": "observation",        # Coastal Pollution / Plastic Hotspot
    "CT07": "observation",        # Habitat Condition Survey
    "CT08": "observation",        # Fishing Activity / Vessel Observation
    "CT09": "observation",        # Surveillance-Relevant Maritime Information
    "CT10": "local_knowledge",    # Traditional Ecological Knowledge Record
    "CT11": "observation",        # Emergency Hazard Report
    "CT12": "ocean_sound",        # Underwater Acoustic Event
}

# slug of workbook district name -> slug of existing district
DISTRICT_ALIASES = {
    "kanniyakumari": "kanyakumari",
}

# Contribution fields stored as FK ids when diffing existing rows
FK_FIELDS = {"user", "village", "zone", "catalogue_type"}

MEMBER_STATUS_MAP = {
    "New": "community_member",
    "Aware but inactive": "occasional",
}


def _text(value):
    return str(value).strip() if value is not None else ""


class Command(BaseCommand):
    help = (
        "Import the O3L contributor final database XLSX (Locations, Community_Members, "
        "Contribution_Catalogue, Contributions, Recognition_Leaderboard) into the Django database. "
        "Idempotent: rows are keyed by their workbook IDs (external_id)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default=DEFAULT_FILE,
            help=f"Path to the XLSX file (default: {DEFAULT_FILE})",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run the whole import inside a transaction and roll it back",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Limit rows per data sheet (0 = no limit)",
        )
        parser.add_argument(
            "--delete-imported",
            action="store_true",
            help=(
                "Delete previously imported rows (contributions and users carrying workbook "
                "external_ids) and exit. Locations/zones/districts are kept because the import "
                "reuses them idempotently."
            ),
        )

    def handle(self, *args, **options):
        path = options["file"]
        if not os.path.exists(path):
            raise CommandError(f"File not found: {path}")

        try:
            import openpyxl
        except ImportError:
            raise CommandError(
                "openpyxl is not installed. Run: pip install openpyxl"
            )

        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        missing = [s for s in REQUIRED_SHEETS if s not in wb.sheetnames]
        if missing:
            raise CommandError(f"Missing sheets in workbook: {', '.join(missing)}")

        self.dry_run = options["dry_run"]
        self.limit = options["limit"] or None
        self.stats = defaultdict(lambda: {"created": 0, "reused": 0, "skipped": 0})
        self.member_map = {}
        self.village_by_locid = {}
        self.village_by_town = {}
        self.contribs_by_member = defaultdict(list)
        self.catalogue_by_id = {}
        self.region_map = {}

        if options["delete_imported"]:
            self._delete_imported(wb)
            return

        try:
            with transaction.atomic():
                self._import_catalogue(wb)
                self._import_locations(wb)
                self._import_members(wb)
                self._import_contributions(wb)
                self._import_leaderboard(wb)
                self._import_transactions(wb)
                self._import_agency_referrals(wb)
                self._import_awareness_zones(wb)
                self._import_campaigns(wb)
                self._import_ambassadors(wb)
                self._import_connections(wb)
                self._import_referrals(wb)
                self._import_moderation_queue(wb)
                # The workbook leaderboard sheet carries lifetime aggregates that
                # exceed the imported contribution rows (the Contributions sheet
                # only holds a ~2-row sample per member). Close the gap with one
                # clearly-labelled aggregate row per member so every lifetime
                # total is itemised on the contributor page, then recompute
                # scoreboards and rebuild awards from those totals.
                from django.core.management import call_command

                call_command('backfill_legacy_contributions')
                from recognition.services import refresh_all_scores, regenerate_awards

                refresh_all_scores()
                regenerate_awards()
                if self.dry_run:
                    transaction.set_rollback(True)
        except CommandError:
            raise
        except Exception as exc:
            raise CommandError(f"Import failed (transaction rolled back): {exc}")

        self._print_summary()

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _read(ws, limit=None):
        rows = ws.iter_rows(values_only=True)
        header = list(next(rows))
        out = []
        for row in rows:
            if not any(v is not None for v in row):
                continue
            out.append(dict(zip(header, row)))
            if limit and len(out) >= limit:
                break
        return out

    @staticmethod
    def _box(points, pad):
        lngs = [p[0] for p in points]
        lats = [p[1] for p in points]
        ring = [
            (min(lngs) - pad, min(lats) - pad),
            (max(lngs) + pad, min(lats) - pad),
            (max(lngs) + pad, max(lats) + pad),
            (min(lngs) - pad, max(lats) + pad),
            (min(lngs) - pad, min(lats) - pad),
        ]
        return MultiPolygon(Polygon(ring))

    @staticmethod
    def _parse_date(value):
        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, date):
            dt = datetime.combine(value, time.min)
        else:
            dt = datetime.strptime(str(value)[:10], "%Y-%m-%d")
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=dt_timezone.utc)
        return dt

    @staticmethod
    def _age_bucket(age):
        try:
            age = int(age)
        except (TypeError, ValueError):
            return ""
        start = (age // 10) * 10
        return f"{start}-{start + 9}"

    @staticmethod
    def _split_name(name):
        parts = _text(name).split(" ", 1)
        return parts[0], (parts[1] if len(parts) > 1 else "")

    def _count(self, section, key, n=1):
        self.stats[section][key] = self.stats[section].get(key, 0) + n

    # ------------------------------------------------------------------ steps

    def _import_catalogue(self, wb):
        rows = self._read(wb["Contribution_Catalogue"], self.limit)
        for r in rows:
            name = _text(r["Contribution_Type"])
            slug = slugify(name)
            price = r.get("Fixed_Price_INR")
            channel = _text(r.get("Reward_Channel"))
            description = (
                f"[{_text(r['Contribution_Type_ID'])}] "
                f"{_text(r['Eligibility_Description'])} | "
                f"Rs.{price} | {channel}"
            )
            obj, created = ContributionType.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": description,
                    "points_verified": int(r.get("Base_Points_B") or 10),
                    "points_submitted": max(1, int(r.get("Base_Points_B") or 10) // 2),
                },
            )
            base_points = int(r.get("Base_Points_B") or 10)
            channel_key = "agency_referral" if "agency" in channel.lower() else "marketplace"
            updates = {
                "catalogue_id": _text(r["Contribution_Type_ID"]),
                "name": name,
                "description": description,
                "base_points_b": Decimal(base_points),
                "points_verified": base_points,
                "points_submitted": max(1, base_points // 2),
                "fixed_price_inr": Decimal(str(price or 0)),
                "reward_channel": channel_key,
                "marketplace_eligible": channel_key == "marketplace",
                "requires_geotag": "geotag" in _text(r["Eligibility_Description"]).lower(),
            }
            dirty = []
            for k, v in updates.items():
                current = getattr(obj, k)
                if isinstance(current, Decimal) and isinstance(v, (int, float)):
                    v = Decimal(str(v))
                if current != v:
                    setattr(obj, k, v)
                    dirty.append(k)
            if dirty:
                obj.save(update_fields=dirty)
                self._count("ContributionType", "updated")
            self._count("ContributionType", "created" if created else "reused")
            if obj.catalogue_id:
                self.catalogue_by_id[obj.catalogue_id] = obj

    def _import_locations(self, wb):
        rows = self._read(wb["Locations"], self.limit)
        if not rows:
            return

        region_points = defaultdict(list)
        district_rows = defaultdict(list)
        for r in rows:
            lng, lat = float(r["Longitude"]), float(r["Latitude"])
            region_points[
                (_text(r["Coastal_Region"]), _text(r["State"]))
            ].append((lng, lat))
            district_rows[(_text(r["District"]), _text(r["State"]))].append(r)

        # Coastal regions: 22 named regions, one row per (name, state)
        self.region_map = {}
        for (region, state), points in sorted(region_points.items()):
            if not region:
                continue
            lng = sum(p[0] for p in points) / len(points)
            lat = sum(p[1] for p in points) / len(points)
            region_obj, created = CoastalRegion.objects.get_or_create(
                name=region,
                state=state,
                defaults={
                    "slug": slugify(f"{state}-{region}"),
                    "latitude": round(lat, 6),
                    "longitude": round(lng, 6),
                    "order": len(self.region_map),
                    "description": (
                        f"{region} — {state} coastal region (seeded from workbook)"
                    ),
                },
            )
            self.region_map[(region, state)] = region_obj
            self._count("CoastalRegion", "created" if created else "reused")

        # Zones: one per workbook Coastal_Region, reused by unique slug
        zone_by_slug = {}
        next_number = (
            Zone.objects.aggregate(max_n=Max("zone_number"))["max_n"] or 0
        ) + 1
        for (region, _state), points in region_points.items():
            if not region:
                continue
            slug = slugify(region)
            zone = Zone.objects.filter(slug=slug).first()
            if zone is None:
                zone = Zone(
                    name=region,
                    slug=slug,
                    zone_number=next_number,
                    boundary=self._box(points, 0.1),
                    description="Synthetic boundary generated by import_contributor_db",
                )
                zone.save()
                next_number += 1
                self._count("Zone", "created")
            else:
                self._count("Zone", "reused")
            zone_by_slug[slug] = zone

        # Districts: reused by slug (with aliases), new ones get synthetic boundary
        district_map = {}
        for (dname, state), drows in district_rows.items():
            slug = slugify(dname)
            slug = DISTRICT_ALIASES.get(slug, slug)
            district = District.objects.filter(slug=slug).first()
            if district is None:
                regions = [_text(r["Coastal_Region"]) for r in drows]
                main_region = max(set(regions), key=regions.count)
                points = [(float(r["Longitude"]), float(r["Latitude"])) for r in drows]
                district = District(
                    name=dname,
                    slug=slug,
                    zone=zone_by_slug[slugify(main_region)],
                    boundary=self._box(points, 0.05),
                    state=state,
                )
                district.save()
                self._count("District", "created")
            else:
                self._count("District", "reused")
            district_map[dname] = district

        # Villages: external_id first, then (slug, district) natural key
        for r in rows:
            loc_id = _text(r["Location_ID"])
            name = _text(r["Coastal_Town_or_Village"]) or _text(r["Display_Name"])
            slug = slugify(name)
            district = district_map[_text(r["District"])]
            region_obj = self.region_map.get(
                (_text(r["Coastal_Region"]), _text(r["State"]))
            )
            village = Village.objects.filter(slug=slug, district=district).first()
            if village is None:
                village = Village(
                    name=name,
                    slug=slug,
                    district=district,
                    region=region_obj,
                    center=Point(float(r["Longitude"]), float(r["Latitude"]), srid=4326),
                    latitude=float(r["Latitude"]),
                    longitude=float(r["Longitude"]),
                    is_coastal=True,
                    external_id=loc_id,
                )
                village.save()
                self._count("Village", "created")
            else:
                self._count("Village", "reused")
                patched = []
                if not village.external_id:
                    village.external_id = loc_id
                    patched.append("external_id")
                if region_obj and village.region_id != region_obj.id:
                    village.region = region_obj
                    patched.append("region")
                if patched:
                    village.save(update_fields=patched)
            # duplicate towns (e.g. Cuddalore x3) share one Village row,
            # but every Location_ID still resolves
            self.village_by_locid[loc_id] = village
            town_key = (name.lower(), _text(r["District"]).lower())
            self.village_by_town.setdefault(town_key, village)

    def _import_members(self, wb):
        rows = self._read(wb["Community_Members"], self.limit)
        for r in rows:
            ext = _text(r["Member_ID"])
            user = User.objects.filter(external_id=ext).first()
            if user is None:
                username = ext.lower()
                base = username
                suffix = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base}{suffix}"
                    suffix += 1
                user = User(
                    username=username,
                    email=f"{ext.lower()}@members.o3l.example",
                    role="COMMUNITY_MEMBER",
                )
                user.set_unusable_password()
                created = True
            else:
                created = False

            first_name, last_name = self._split_name(r["Name"])
            user.first_name = first_name
            user.last_name = last_name
            user.external_id = ext
            user.gender = _text(r["Gender"])
            user.age_range = self._age_bucket(r.get("Age"))
            user.is_verified = int(r.get("Verified_Contributions") or 0) > 0
            user.save()
            self._count("User", "created" if created else "reused")
            self.member_map[ext] = user

            profile, _ = Profile.objects.get_or_create(user=user)
            village = self.village_by_locid.get(_text(r["Location_ID"]))
            if village is None:
                village = self.village_by_town.get(
                    (
                        _text(r["Coastal_Town_or_Village"]).lower(),
                        _text(r["District"]).lower(),
                    )
                )
            profile.village = village
            profile.occupation = _text(r["Occupation"])
            profile.location_precision = "village"
            opt_in = _text(r["Map_Connection_Opt_In"]).lower().startswith("y")
            profile.appear_on_map = opt_in
            profile.show_earnings = opt_in
            profile.allow_connection_requests = opt_in
            profile.member_status = MEMBER_STATUS_MAP.get(
                _text(r["Awareness_Status"]), "community_member"
            )
            if r.get("Latitude") is not None and r.get("Longitude") is not None:
                profile.latitude = float(r["Latitude"])
                profile.longitude = float(r["Longitude"])
            profile.metadata = {
                **(profile.metadata or {}),
                "member_id": ext,
                "state": _text(r["State"]),
                "district": _text(r["District"]),
                "coastal_region": _text(r["Coastal_Region"]),
                "awareness_status": _text(r["Awareness_Status"]),
                "preferred_contact": _text(r["Preferred_Contact"]),
                "connection_status": _text(r["Connection_Status"]),
                "map_connection_opt_in": _text(r["Map_Connection_Opt_In"]),
                "public_profile_name": _text(r["Public_Profile_Name"]),
                "marketplace_eligible": _text(r["Marketplace_Eligible"]),
                "age": r.get("Age"),
                "source_sheet": "Community_Members",
            }
            profile.save()

    def _import_contributions(self, wb):
        rows = self._read(wb["Contributions"], self.limit)
        if not rows:
            return
        existing = set(
            Contribution.objects.exclude(external_id=None)
            .values_list("external_id", flat=True)
        )

        for r in rows:
            ext = _text(r["Contribution_ID"])

            user = self.member_map.get(_text(r["Member_ID"]))
            if user is None:
                user = User.objects.filter(
                    external_id=_text(r["Member_ID"])
                ).first()
            if user is None:
                self._count("Contribution", "skipped")
                continue

            village = self.village_by_town.get(
                (_text(r["Location"]).lower(), _text(r["District"]).lower())
            )
            if village is None:
                village = self.village_by_locid.get(_text(r.get("Location_ID") or ""))

            ct_id = _text(r["Contribution_Type_ID"])
            catalogue = self.catalogue_by_id.get(ct_id)
            moderation = _text(r["Moderation_Decision"]).upper()
            safety = _text(r["Safety_Status"]).upper()
            visibility = _text(r["Visibility_Status"]).upper()
            relevance_action = _text(r["Relevance_Action"]).upper()
            if moderation == "REJECTED" or safety == "REJECTED":
                status = "rejected"
            elif moderation == "HUMAN_REVIEW":
                status = "moderator_review"
            elif relevance_action == "REJECT":
                status = "rejected"
            else:
                status = "verified"

            submitted_at = self._parse_date(r["Date"])
            final_score = float(r["Final_Score_Points"] or 0)
            q = float(r["Q_Quality"] or 1)
            v = float(r["V_Verification"] or 1)
            i = float(r["I_Impact"] or 1)
            rr = float(r["R_Relevance"] or 1)
            if catalogue is not None and catalogue.base_points_b:
                base = float(catalogue.base_points_b)
            else:
                divisor = q * v * i
                base = round(final_score / divisor, 2) if divisor else final_score
            if not final_score:
                final_score = round(base * q * v * i, 2)

            lng, lat = float(r["Longitude"]), float(r["Latitude"])
            evidence = _text(r["Evidence_Type"])
            if evidence.lower().startswith("audio"):
                evidence = "Audio"
            elif evidence.lower().startswith("photo"):
                evidence = "Photo"
            elif evidence.lower().startswith("video"):
                evidence = "Video"

            relevance_level = _text(r["Relevance_Level"]).lower()
            if "highly" in relevance_level:
                relevance_level = "highly_relevant"
            elif "unrelated" in relevance_level:
                relevance_level = "unrelated"
            elif "unclear" in relevance_level or "weak" in relevance_level:
                relevance_level = "unclear"
            else:
                relevance_level = "relevant"

            fields = {
                "external_id": ext,
                "user": user,
                "type": TYPE_MAP.get(ct_id, "observation"),
                "status": status,
                "location": Point(lng, lat, srid=4326),
                "village": village,
                "zone": village.district.zone if village and village.district else None,
                "location_precision": "village",
                "quality_score": q,
                "points": int(round(final_score)),
                "catalogue_type": catalogue,
                "base_points": base,
                "q_quality": q,
                "v_verification": v,
                "i_impact": i,
                "r_relevance": rr,
                "final_score_points": final_score,
                "evidence_type": evidence,
                "safety_status": safety if safety in dict(Contribution.SAFETY_CHOICES) else "PENDING",
                "safety_category": _text(r["Safety_Category"]),
                "relevance_level": relevance_level,
                "moderation_decision": moderation
                if moderation in dict(Contribution.MODERATION_CHOICES)
                else "PENDING",
                "visibility_status": visibility
                if visibility in dict(Contribution.VISIBILITY_CHOICES)
                else "PRIVATE",
                "submitted_at": submitted_at,
                "verified_at": submitted_at if status == "verified" else None,
                "metadata": {
                    "contribution_type_id": ct_id,
                    "contribution_type": _text(r["Contribution_Type"]),
                    "evidence_type": _text(r["Evidence_Type"]),
                    "q_quality": r.get("Q_Quality"),
                    "v_verification": r.get("V_Verification"),
                    "i_impact": r.get("I_Impact"),
                    "r_relevance": r.get("R_Relevance"),
                    "relevance_level": _text(r["Relevance_Level"]),
                    "relevance_action": _text(r["Relevance_Action"]),
                    "final_score": final_score,
                    "safety_status": safety,
                    "safety_category": _text(r["Safety_Category"]),
                    "visibility_status": _text(r["Visibility_Status"]),
                    "marketplace_status": _text(r["Marketplace_Status"]),
                    "marketplace_visibility": _text(r["Marketplace_Visibility"]),
                    "sale_price_inr": r.get("Sale_Price_INR"),
                    "eligible_after_25_verified": _text(
                        r["Eligible_After_25_Verified"]
                    ),
                    "agency_referral": _text(r["Agency_Referral"]),
                    "moderation_decision": moderation,
                    "state": _text(r["State"]),
                    "district": _text(r["District"]),
                    "location": _text(r["Location"]),
                    "coastal_region": _text(r["Coastal_Region"]),
                    "source_sheet": "Contributions",
                },
            }

            obj = Contribution.objects.filter(external_id=ext).first()
            if obj is None:
                Contribution(**fields).save()
                self._count("Contribution", "created")
            else:
                changed = []
                for key, value in fields.items():
                    if key in FK_FIELDS:
                        current = getattr(obj, key + "_id")
                        new = value.pk if value is not None else None
                    else:
                        current = getattr(obj, key)
                        new = value
                    if isinstance(current, Decimal) and isinstance(new, (int, float)):
                        new = Decimal(str(new))
                    if current != new:
                        setattr(obj, key, value)
                        changed.append(key)
                if changed:
                    obj.save(update_fields=changed)
                    self._count("Contribution", "updated")
                else:
                    self._count("Contribution", "reused")

            existing.add(ext)
            self.contribs_by_member[_text(r["Member_ID"])].append(
                (final_score, q)
            )

    def _import_leaderboard(self, wb):
        rows = self._read(wb["Recognition_Leaderboard"], self.limit)
        for r in rows:
            ext = _text(r["Member_ID"])
            user = self.member_map.get(ext) or User.objects.filter(
                external_id=ext
            ).first()
            if user is None:
                self._count("Leaderboard", "skipped")
                continue

            total_score = float(r["Total_Score_Points"] or 0)
            verified = int(r["Verified_Contributions"] or 0)
            member_contribs = self.contribs_by_member.get(ext, [])
            if not member_contribs:
                member_contribs = [
                    (c.points, c.quality_score)
                    for c in user.contributions.all()
                ]

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.contribution_score = round(total_score)
            profile.total_verified = verified
            profile.total_contributions = len(member_contribs)
            profile.metadata = {
                **(profile.metadata or {}),
                "leaderboard": {
                    "total_score_points": total_score,
                    "verified_contributions": verified,
                    "data_items_sold": r.get("Data_Items_Sold"),
                    "gross_sales_inr": r.get("Gross_Sales_INR"),
                    "contributor_earnings_inr": r.get("Contributor_Earnings_INR"),
                    "badges": _text(r["Badges"]),
                    "rank": r.get("Leaderboard_Rank"),
                },
            }
            profile.save()

            score, score_created = ContributionScore.objects.get_or_create(user=user)
            score.total_score = round(total_score)
            score.verified_contributions = verified
            score.total_contributions = len(member_contribs)
            score.data_items_sold = int(r.get("Data_Items_Sold") or 0)
            score.gross_sales_inr = float(r.get("Gross_Sales_INR") or 0)
            score.earnings_inr = float(r.get("Contributor_Earnings_INR") or 0)
            score.marketplace_eligible = verified >= MARKETPLACE_ELIGIBILITY_THRESHOLD
            if member_contribs:
                score.quality_average = round(
                    sum(q for _, q in member_contribs) / len(member_contribs), 3
                )
            score.save()
            self._count("Leaderboard", "created" if score_created else "reused")

    def _import_transactions(self, wb):
        """Marketplace_Transactions -> DataListing + DataSale (the ₹ earnings)."""
        if "Marketplace_Transactions" not in wb.sheetnames:
            return
        from marketplace.models import DataListing, DataSale

        for r in self._read(wb["Marketplace_Transactions"], self.limit):
            contribution = Contribution.objects.filter(
                external_id=_text(r["Contribution_ID"])
            ).first()
            if contribution is None:
                self._count("DataSale", "skipped")
                continue

            status = _text(r["Payment_Status"]).lower()
            if status not in ("pending", "paid", "failed", "refunded"):
                status = "paid"
            gross = Decimal(str(r["Gross_Price_INR"] or 0))
            fee = Decimal(str(r["Platform_Fee_INR"] or 0))
            earning = Decimal(str(r["Contributor_Earning_INR"] or 0))
            licence = _text(r["License_Type"]) or "Non-exclusive data licence"

            listing, created = DataListing.objects.get_or_create(
                contribution=contribution,
                defaults={
                    "seller": contribution.user,
                    "title": f"{_text(r['Contribution_Type'])} — {_text(r['Location'])}",
                    "description": (
                        f"{_text(r['Contribution_Type'])} from {_text(r['District'])}, "
                        f"{_text(r['State'])} ({contribution.external_id})"
                    ),
                    "price_inr": gross,
                    "status": "sold" if status == "paid" else "available",
                    "license_type": licence,
                    "listed_at": contribution.submitted_at,
                    "sold_at": contribution.verified_at if status == "paid" else None,
                },
            )
            self._count("DataListing", "created" if created else "reused")

            sale, created = DataSale.objects.get_or_create(
                contribution=contribution,
                defaults={
                    "listing": listing,
                    "seller": contribution.user,
                    "buyer_name": "Licensed research buyer",
                    "gross_inr": gross,
                    "platform_fee_inr": fee,
                    "contributor_earning_inr": earning,
                    "payment_status": status,
                    "license_type": licence,
                    "paid_at": contribution.verified_at if status == "paid" else None,
                },
            )
            self._count("DataSale", "created" if created else "reused")

    def _import_agency_referrals(self, wb):
        """CT09 surveillance contributions -> AgencyReferral rows."""
        from marketplace.models import AgencyReferral

        qs = Contribution.objects.filter(
            catalogue_type__catalogue_id="CT09",
            external_id__isnull=False,
        ).exclude(external_id="")
        for contribution in qs:
            _, created = AgencyReferral.objects.get_or_create(
                contribution=contribution,
                defaults={
                    "contributor": contribution.user,
                    "agency": "coast_guard",
                    "status": "acknowledged"
                    if contribution.status == "verified"
                    else "under_review",
                },
            )
            self._count("AgencyReferral", "created" if created else "reused")

    def _import_awareness_zones(self, wb):
        """Awareness_Zones -> AwarenessZone (red / yellow / green outreach map)."""
        if "Awareness_Zones" not in wb.sheetnames:
            return
        from outreach.models import AwarenessZone

        band_rank = {"red": 3, "yellow": 2, "green": 1}
        pending = {}
        for r in self._read(wb["Awareness_Zones"], self.limit):
            village = self.village_by_locid.get(_text(r["Location_ID"]))
            if village is None:
                self._count("AwarenessZone", "skipped")
                continue

            band_raw = _text(r["Contribution_Awareness_Band"]).lower()
            if band_raw.startswith("high"):
                band = "green"
            elif band_raw.startswith("medium") or band_raw.startswith("mod"):
                band = "yellow"
            else:
                band = "red"

            acc = pending.setdefault(
                village.id,
                {
                    "location": village,
                    "state": _text(r["State"]),
                    "district": _text(r["District"]),
                    "coastal_region": village.region,
                    "latitude": float(r["Latitude"] or 0) or None,
                    "longitude": float(r["Longitude"] or 0) or None,
                    "registered_members": 0,
                    "verified_contributions": 0,
                    "detailed_contributions": 0,
                    "new_awareness_count": 0,
                    "aware_or_active_count": 0,
                    "band": band,
                    "recommended_intervention": _text(r["Recommended_Intervention"]),
                },
            )
            acc["registered_members"] += int(r["Registered_Members"] or 0)
            acc["verified_contributions"] += int(
                r["Profile_Verified_Contributions"] or 0
            )
            acc["detailed_contributions"] += int(r["Detailed_Contributions"] or 0)
            acc["new_awareness_count"] += int(r["New_Awareness_Count"] or 0)
            acc["aware_or_active_count"] += int(r["Aware_or_Active_Count"] or 0)
            if band_rank.get(band, 0) > band_rank.get(acc["band"], 0):
                acc["band"] = band
            if not acc["coastal_region"]:
                acc["coastal_region"] = village.region

        for zone_id, values in pending.items():
            obj, created = AwarenessZone.objects.update_or_create(
                location=values["location"], defaults=values
            )
            self._count("AwarenessZone", "created" if created else "updated")

    def _import_campaigns(self, wb):
        """Outreach_Campaigns -> OutreachCampaign."""
        if "Outreach_Campaigns" not in wb.sheetnames:
            return
        from outreach.models import OutreachCampaign

        def map_type(raw):
            low = raw.lower()
            if "harbour" in low:
                return "harbour"
            if "village" in low:
                return "village"
            if "fisheries" in low:
                return "fisheries_station"
            if "women" in low:
                return "fisherwomen"
            if "student" in low or "volunteer" in low or "college" in low:
                return "college"
            return "digital"

        for r in self._read(wb["Outreach_Campaigns"], self.limit):
            campaign_id = _text(r["Campaign_ID"])
            priority = _text(r["Priority"]).lower()
            if priority not in ("high", "medium", "low"):
                priority = "medium"
            state = _text(r["State"])
            region_obj = None
            if state and state.lower() != "all 4 states":
                region_obj = next(
                    (
                        v.region
                        for v in Village.objects.filter(
                            district__state=state, region__isnull=False
                        ).select_related("region")[:50]
                    ),
                    None,
                )
            obj, created = OutreachCampaign.objects.update_or_create(
                campaign_id=campaign_id,
                defaults={
                    "state": state,
                    "coastal_region": region_obj,
                    "campaign_type": map_type(_text(r["Campaign_Type"])),
                    "name": _text(r["Campaign_Name"]),
                    "delivery_channel": _text(r["Delivery_Channel"]),
                    "message": _text(r["Message"]),
                    "acquisition_method": _text(r["Acquisition_Method"]),
                    "cadence": _text(r["Cadence"]),
                    "priority": priority,
                    "success_target": _text(r["Success_Target"]),
                    "is_active": True,
                },
            )
            self._count("OutreachCampaign", "created" if created else "updated")

    def _import_ambassadors(self, wb):
        """Volunteers -> Ambassador (village-level trust anchors)."""
        if "Volunteers" not in wb.sheetnames:
            return
        from outreach.models import Ambassador

        for r in self._read(wb["Volunteers"], self.limit):
            volunteer_id = _text(r["Volunteer_ID"])
            village = self.village_by_locid.get(_text(r["Location_ID"]))
            level_raw = _text(r["Volunteer_Level"]).lower()
            level = "level_1"
            if "2" in level_raw:
                level = "level_2"
            elif "3" in level_raw:
                level = "level_3"
            region_obj = self.region_map.get(
                (_text(r["Coastal_Region"]), _text(r["State"]))
            ) or (village.region if village else None)
            obj, created = Ambassador.objects.update_or_create(
                volunteer_id=volunteer_id,
                defaults={
                    "name": _text(r["Name"]),
                    "gender": _text(r["Gender"]),
                    "primary_skill": _text(r["Primary_Skill"]),
                    "village": village,
                    "state": _text(r["State"]),
                    "district": _text(r["District"]),
                    "coastal_region": region_obj,
                    "latitude": float(r["Latitude"]) if r.get("Latitude") else None,
                    "longitude": float(r["Longitude"]) if r.get("Longitude") else None,
                    "availability": _text(r["Availability"]),
                    "level": level,
                    "volunteer_type": _text(r["Volunteer_Type"]) or "Community Ambassador",
                    "status": _text(r["Status"]) or "Active",
                },
            )
            self._count("Ambassador", "created" if created else "updated")

    def _import_connections(self, wb):
        """Connection_Requests -> ConnectionRequest (new user -> nearest contributor)."""
        if "Connection_Requests" not in wb.sheetnames:
            return
        from outreach.models import ConnectionRequest

        for r in self._read(wb["Connection_Requests"], self.limit):
            from_user = (
                User.objects.filter(external_id=_text(r["From_User_ID"])).first()
                or User.objects.filter(username__iexact=_text(r["From_User_ID"])).first()
            )
            to_user = (
                User.objects.filter(external_id=_text(r["To_Contributor_ID"])).first()
                or User.objects.filter(
                    username__iexact=_text(r["To_Contributor_ID"]).lower()
                ).first()
            )
            if from_user is None or to_user is None:
                self._count("ConnectionRequest", "skipped")
                continue
            status = _text(r["Status"]).lower() or "requested"
            if status not in ("requested", "accepted", "declined", "blocked"):
                status = "requested"
            obj, created = ConnectionRequest.objects.get_or_create(
                from_user=from_user,
                to_user=to_user,
                defaults={
                    "status": status,
                    "purpose": _text(r["Purpose"]) or "Friend/mentor connection",
                },
            )
            self._count("ConnectionRequest", "created" if created else "reused")

    def _import_referrals(self, wb):
        """Referral_Programme -> Referral."""
        if "Referral_Programme" not in wb.sheetnames:
            return
        from outreach.models import Referral

        for r in self._read(wb["Referral_Programme"], self.limit):
            referrer = (
                User.objects.filter(external_id=_text(r["Referrer_ID"])).first()
                or User.objects.filter(
                    username__iexact=_text(r["Referrer_ID"]).lower()
                ).first()
            )
            if referrer is None:
                self._count("Referral", "skipped")
                continue
            raw = _text(r["Referral_Status"]).lower()
            status = "qualified" if "completed" in raw or "verified" in raw else "pending"
            obj, created = Referral.objects.get_or_create(
                referral_code=_text(r["Referral_ID"]),
                defaults={
                    "referrer": referrer,
                    "relationship": _text(r["Relationship"]),
                    "acquisition_method": _text(r["Acquisition_Method"]),
                    "status": status,
                    "points_awarded": int(r["Demonstration_Referral_Points"] or 50),
                },
            )
            self._count("Referral", "created" if created else "reused")

    def _import_moderation_queue(self, wb):
        """Moderation_Queue -> R-relevance / safety / visibility on contributions."""
        if "Moderation_Queue" not in wb.sheetnames:
            return

        for r in self._read(wb["Moderation_Queue"], self.limit):
            contribution = Contribution.objects.filter(
                external_id=_text(r["Contribution_ID"])
            ).first()
            if contribution is None:
                self._count("ModerationQueue", "skipped")
                continue

            safety = _text(r["Safety_Status"]).upper()
            moderation = _text(r["Moderation_Decision"]).upper()
            visibility = _text(r["Visibility_Status"]).upper()
            relevance = float(r["R_Relevance"] or 1)
            level = _text(r["Relevance_Level"]).lower()
            if "highly" in level:
                level = "highly_relevant"
            elif "unrelated" in level:
                level = "unrelated"
            elif "unclear" in level or "weak" in level:
                level = "unclear"
            else:
                level = "relevant"

            if "UNDER REVIEW" in visibility:
                visibility = "UNDER_REVIEW"
            elif "QUARANTINE" in visibility or "PRIVATE" in visibility:
                visibility = "PRIVATE"
            elif "MARKETPLACE" in visibility:
                visibility = "MARKETPLACE_VISIBLE"
            elif "COMMUNITY" in visibility:
                visibility = "COMMUNITY_VISIBLE"
            else:
                visibility = "PRIVATE"

            status = contribution.status
            if moderation == "REJECTED" or safety == "REJECTED":
                status = "rejected"
            elif moderation == "HUMAN_REVIEW":
                status = "moderator_review"

            fields = {
                "safety_status": safety
                if safety in dict(Contribution.SAFETY_CHOICES)
                else "PENDING",
                "safety_category": _text(r["Safety_Category"]),
                "moderation_decision": moderation
                if moderation in dict(Contribution.MODERATION_CHOICES)
                else "PENDING",
                "visibility_status": visibility,
                "relevance_level": level,
                "r_relevance": relevance,
                "status": status,
            }
            changed = [k for k, v in fields.items() if getattr(contribution, k) != v]
            if changed:
                for k in changed:
                    setattr(contribution, k, fields[k])
                contribution.save(update_fields=changed)
                self._count("ModerationQueue", "updated")
            else:
                self._count("ModerationQueue", "reused")

    def _import_awards(self, wb):
        """Recognition_Leaderboard -> RecognitionAward (state top-3 + marketplace)."""
        if "Recognition_Leaderboard" not in wb.sheetnames:
            return
        from django.utils import timezone

        from recognition.models import RecognitionAward

        year = timezone.now().year
        rows = self._read(wb["Recognition_Leaderboard"], self.limit)
        by_state = defaultdict(list)
        for r in rows:
            by_state[_text(r["State"])].append(r)

        for state, members in by_state.items():
            members.sort(key=lambda x: float(x.get("Leaderboard_Rank") or 9999))
            for position, r in enumerate(members[:3], start=1):
                user = self.member_map.get(_text(r["Member_ID"]))
                if user is None:
                    continue
                category = "data_contributor" if position == 1 else "community_champion"
                title = f"{state} Rank #{position} Contributor {year}"
                obj, created = RecognitionAward.objects.get_or_create(
                    user=user,
                    title=title,
                    defaults={
                        "category": category,
                        "year": year,
                        "description": (
                            f"Ranked #{position} in {state} with "
                            f"{r['Total_Score_Points']} score points and "
                            f"{r['Verified_Contributions']} verified contributions."
                        ),
                        "village": user.profile.village
                        if getattr(user, "profile", None)
                        else None,
                        "score": float(r["Total_Score_Points"] or 0),
                        "rank": position,
                    },
                )
                self._count("RecognitionAward", "created" if created else "reused")

        for r in rows:
            if "Marketplace Eligible" not in _text(r.get("Badges")):
                continue
            user = self.member_map.get(_text(r["Member_ID"]))
            if user is None:
                continue
            obj, created = RecognitionAward.objects.get_or_create(
                user=user,
                title=f"Marketplace Eligible Contributor {year}",
                defaults={
                    "category": "marine_guardian",
                    "year": year,
                    "description": (
                        "Cleared the 25 verified contribution gate — their data "
                        "can be licensed on the O3L marketplace."
                    ),
                    "village": user.profile.village
                    if getattr(user, "profile", None)
                    else None,
                    "score": float(r["Total_Score_Points"] or 0),
                },
            )
            self._count("RecognitionAward", "created" if created else "reused")

    def _delete_imported(self, wb):
        member_ids = [_text(r["Member_ID"]) for r in self._read(wb["Community_Members"])]
        contribution_ids = [
            _text(r["Contribution_ID"]) for r in self._read(wb["Contributions"])
        ]
        with transaction.atomic():
            c_deleted, _ = Contribution.objects.filter(
                external_id__in=contribution_ids
            ).delete()
            u_deleted, _ = User.objects.filter(external_id__in=member_ids).delete()
            if self.dry_run:
                transaction.set_rollback(True)
        verb = "Would delete" if self.dry_run else "Deleted"
        self.stdout.write(
            f"{verb} imported rows: {c_deleted} contribution records, "
            f"{u_deleted} user records (locations/zones/districts kept)"
        )

    def _print_summary(self):
        prefix = "DRY RUN (rolled back) — " if self.dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"{prefix}Import summary:"))
        total_c = total_r = total_s = total_u = 0
        for section in sorted(self.stats):
            c = self.stats[section]["created"]
            r = self.stats[section]["reused"]
            s = self.stats[section]["skipped"]
            u = self.stats[section].get("updated", 0)
            total_c += c
            total_r += r
            total_s += s
            total_u += u
            line = f"  {section:<18} created={c:<6} updated={u:<6} reused={r:<6} skipped={s}"
            self.stdout.write(line)
        self.stdout.write(
            f"  {'TOTAL':<18} created={total_c:<6} updated={total_u:<6} "
            f"reused={total_r:<6} skipped={total_s}"
        )

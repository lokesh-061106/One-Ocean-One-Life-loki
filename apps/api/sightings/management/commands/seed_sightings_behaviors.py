"""Seed the Sightings module from the Dr. R. Kannan CHE07 photo library.

Source layout (Macaulay Library photos, one folder per behaviour):

    new-sightings/
        Dolphins/
            Breaching/MLQ_5383-2_Breaching.jpg
            ...
        Orca/
            spyhop/MLQ_2026-2_spyhop.jpg
            ...
        Risso Dolphins/
            Spy hopping/MLQ_2520_Risso dolphin_spy hopping.jpg
            ...

Each behaviour folder becomes ONE verified MarineSighting (first image is the
photo, every image also lands in the SightingImage gallery) under a category
named after the top-level folder. Contributions are owned by the first
superuser and are immediately published (status=verified). Re-running the
command skips anything already imported unless --force is given.
"""

import shutil
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from contributions.models import Contribution
from sightings.models import MarineSighting, SightingCategory, SightingCategorySpecies, SightingImage

DEFAULT_SOURCE = Path(
    r"I:\MagetechSol\One-Ocean-One-Life\Kannan-details"
    r"\Data (Updated) - CHE07 Challenge (Dr. R. Kannan)\new-sightings"
)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# Top-level folder -> SightingCategory + flagship species.
CATEGORY_CONFIG = {
    "Dolphins": {
        "name": "Dolphins",
        "slug": "dolphins",
        "icon": "\U0001F42C",  # dolphin
        "description": "Dolphin behaviour observations (Macaulay Library photo library).",
        "sort_order": 20,
        "species_common": "Pacific white-sided dolphin",
        "species_scientific": "Lagenorhynchus obliquidens",
        "ai_suggestion": "Pacific white-sided dolphin",
        "species_group": "dolphin",
    },
    "Orca": {
        "name": "Orcas",
        "slug": "orcas",
        "icon": "\U0001F40B",  # whale
        "description": "Orca (killer whale) behaviour observations (Macaulay Library photo library).",
        "sort_order": 21,
        "species_common": "Orca",
        "species_scientific": "Orcinus orca",
        "ai_suggestion": "Orca (killer whale)",
        "species_group": "whale",
    },
    "Risso Dolphins": {
        "name": "Risso Dolphins",
        "slug": "risso-dolphins",
        "icon": "\U0001F42C",
        "description": "Risso's dolphin behaviour observations (Macaulay Library photo library).",
        "sort_order": 22,
        "species_common": "Risso's dolphin",
        "species_scientific": "Grampus griseus",
        "ai_suggestion": "Risso's dolphin",
        "species_group": "dolphin",
    },
    "Gray Whale": {
        "name": "Gray Whale",
        "slug": "gray-whale",
        "icon": "\U0001F40B",  # whale
        "description": "Gray whale behaviour observations (Macaulay Library photo library).",
        "sort_order": 23,
        "species_common": "Gray Whale",
        "species_scientific": "Eschrichtius robustus",
        "ai_suggestion": "Gray Whale",
        "species_group": "whale",
    },
    "Humpback Whale": {
        "name": "Humpback Whale",
        "slug": "humpback-whale",
        "icon": "\U0001F40B",  # whale
        "description": "Humpback whale behaviour observations (Macaulay Library photo library).",
        "sort_order": 24,
        "species_common": "Humpback Whale",
        "species_scientific": "Megaptera novaeangliae",
        "ai_suggestion": "Humpback Whale",
        "species_group": "whale",
    },
    "California Sea Lion": {
        "name": "California Sea Lion",
        "slug": "california-sea-lion",
        "icon": "\U0001F9AD",  # seal
        "description": "California sea lion behaviour observations (Macaulay Library photo library).",
        "sort_order": 25,
        "species_common": "California Sea Lion",
        "species_scientific": "Zalophus californianus",
        "ai_suggestion": "California Sea Lion",
        "species_group": "seal",
    },
    "Harbor Seal": {
        "name": "Harbor Seal",
        "slug": "harbor-seal",
        "icon": "\U0001F9AD",  # seal
        "description": "Harbor seal behaviour observations (Macaulay Library photo library).",
        "sort_order": 26,
        "species_common": "Harbor Seal",
        "species_scientific": "Phoca vitulina",
        "ai_suggestion": "Harbor Seal",
        "species_group": "seal",
    },
    "Sea Otter": {
        "name": "Sea Otter",
        "slug": "sea-otter",
        "icon": "\U0001F9A6",  # otter
        "description": "Sea otter behaviour observations (Macaulay Library photo library).",
        "sort_order": 27,
        "species_common": "Sea Otter",
        "species_scientific": "Enhydra lutris",
        "ai_suggestion": "Sea Otter",
        "species_group": "otter",
    },
}

# Behaviour subfolder (normalised) -> SightingBehavior slug (dynamic list).
BEHAVIOR_MAP = {
    "acrobatic movements": "acrobatic-movements",
    "aerial flip": "aerial-flip",
    "bow riding": "bow-riding",
    "breaching": "breaching",
    "dolphin leaping": "dolphin-leaping",
    "dolphin mid backflip": "dolphin-mid-backflip",
    "foraging dive": "foraging-dive",
    "leaping out of the water": "leaping-out-of-the-water",
    "long beaked": "long-beaked",
    "pectoral fin raised": "pectoral-fin-raised",
    "peeking": "peeking",
    "porpoising": "porpoising",
    "prey tossing": "prey-tossing",
    "social communication": "social-communication",
    "spyhopping": "spyhopping",
    "steep dive": "steep-dive",
    "surfacing and breathing": "surfacing-and-breathing",
    # Orca folders
    "blowing": "blowing",
    "high fluking": "high-fluking",
    "low fluking": "low-fluking",
    "hunting": "hunting",
    "playing with calf": "playing-with-calf",
    "spyhop": "spyhop",
    "surfacing": "surfacing",
    # Risso folders
    "calf surfacing": "calf-surfacing",
    "leaping grouping": "leaping-grouping",
    "playing": "playing",
    "spy hopping": "spy-hopping",
    # Gray Whale folders
    "flippering": "flippering",
    "logging": "logging",
    "low fluking dive": "low-fluking-dive",
    "snaking": "snaking",
    "spouting": "spouting",
    # Humpback Whale folders
    "cooperative feeding": "cooperative-feeding",
    "diving": "diving",
    "high fluking dive": "high-fluking-dive",
    "kickfeeding": "kickfeeding",
    # California Sea Lion folders
    "chasing prey": "chasing-prey",
    "colony hauled out": "colony-hauled-out",
    "floating flipper raised": "floating-flipper-raised",
    "group rafting": "group-rafting",
    "head raising": "head-raising",
    "inspecting buoy": "inspecting-buoy",
    "leaping": "leaping",
    "leaping from water": "leaping-from-water",
    "open mouth display": "open-mouth-display",
    "prey handling fish": "prey-handling-fish",
    "raising flipper": "raising-flipper",
    "scratching grooming": "scratching-grooming",
    "social interaction": "social-interaction",
    "surfacing together": "surfacing-together",
    "vocalizing hauled out": "vocalizing-hauled-out",
    "vocalizing near cormorants": "vocalizing-near-cormorants",
    # Harbor Seal folders
    "surface floating": "surface-floating",
    # Sea Otter folders
    "climbing buoy": "climbing-buoy",
    "close contact": "close-contact",
    "close contact grooming": "close-contact-grooming",
    "feeding octopus": "feeding-octopus",
    "feeding sea urchin": "feeding-sea-urchin",
    "floating grooming": "floating-grooming",
    "floating resting": "floating-resting",
    "prey handling": "prey-handling",
    "prey handling crab": "prey-handling-crab",
    "supine floating": "supine-floating",
    "surface swimming splashing": "surface-swimming-splashing",
    "underwater close contact": "underwater-close-contact",
    "underwater swimming": "underwater-swimming",
}


def _norm(name):
    return " ".join(name.replace("_", " ").replace("-", " ").lower().split())


def _behaviour_for(folder_name):
    return BEHAVIOR_MAP.get(_norm(folder_name), "unknown")


class Command(BaseCommand):
    help = "Seed Sightings categories + MarineSighting records with images from the new-sightings photo library."
    requires_migrations_checks = True

    def add_arguments(self, parser):
        parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Root folder containing Dolphins/Orca/Risso Dolphins.")
        parser.add_argument("--dry-run", action="store_true", help="Report what would be created without writing anything.")
        parser.add_argument("--force", action="store_true", help="Re-import: delete existing records for the same source folders first.")

    def handle(self, *args, **opts):
        self.source = Path(opts["source"])
        self.dry_run = opts["dry_run"]
        self.force = opts["force"]
        self.media_root = Path(settings.MEDIA_ROOT)

        if not self.source.is_dir():
            raise CommandError(f"Source folder not found: {self.source}")

        self.user = get_user_model().objects.filter(is_superuser=True).order_by("date_joined").first()
        if not self.user:
            raise CommandError("No superuser found — create one first (seed_data command).")

        self.stats = {"categories": 0, "species": 0, "created": 0, "skipped": 0, "deleted": 0, "images": 0, "copied": 0, "bytes": 0}

        for folder_name, config in CATEGORY_CONFIG.items():
            top = self.source / folder_name
            if not top.is_dir():
                self.stdout.write(self.style.WARNING(f"Missing folder, skipping: {top}"))
                continue
            category = self._ensure_category(config)
            self._ensure_species(category, config)
            for behaviour_dir in sorted(p for p in top.iterdir() if p.is_dir()):
                self._import_behaviour(category, config, behaviour_dir)

        verb = "Would create" if self.dry_run else "Created"
        self.stdout.write(self.style.SUCCESS(
            f"\n{verb} {self.stats['created']} sighting(s), skipped {self.stats['skipped']}, "
            f"deleted {self.stats['deleted']}, images {self.stats['images']} "
            f"({self.stats['copied']} copied, {self.stats['bytes'] / (1024*1024):.1f} MB), "
            f"categories {self.stats['categories']}, species refs {self.stats['species']}."
        ))

    # ---------- helpers ----------

    def _ensure_category(self, config):
        obj = SightingCategory.objects.filter(slug=config["slug"]).first()
        if obj:
            return obj
        if self.dry_run:
            self.stats["categories"] += 1
            self.stdout.write(f"  category (dry-run): {config['name']}")
            return SightingCategory(slug=config["slug"])
        obj = SightingCategory.objects.create(
            slug=config["slug"],
            name=config["name"],
            icon=config["icon"],
            description=config["description"],
            sort_order=config["sort_order"],
        )
        self.stats["categories"] += 1
        self.stdout.write(f"  category: {config['name']}")
        return obj

    def _ensure_species(self, category, config):
        if self.dry_run:
            return
        _, created = SightingCategorySpecies.objects.get_or_create(
            category=category,
            common_name=config["species_common"],
            defaults={"scientific_name": config["species_scientific"],
                      "source_ref": "Macaulay Library (MLQ photo library)",
                      "sort_order": 1},
        )
        if created:
            self.stats["species"] += 1

    def _import_behaviour(self, category, config, behaviour_dir):
        label = behaviour_dir.name
        marker = f"{category.slug}/{label}"
        files = sorted(
            f for f in behaviour_dir.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXTS
        )
        if not files:
            return

        existing = Contribution.objects.filter(
            type="marine_sighting", metadata__source_folder=marker
        ).first()
        if existing and not self.force:
            self.stats["skipped"] += 1
            return
        if existing and self.force:
            if not self.dry_run:
                pk = existing.pk
                existing.delete()  # cascades to marine_sighting + images
            self.stats["deleted"] += 1

        behaviour = _behaviour_for(label)
        title = f"{category.name} — {label}"
        source_ids = ", ".join(f.stem for f in files[:8]) + ("…" if len(files) > 8 else "")
        notes = (
            f"<p><strong>{label}</strong> — observed behaviour of the {config['species_common']} "
            f"(<em>{config['species_scientific']}</em>).</p>"
            f"<p>Photos: Macaulay Library — {source_ids}.</p>"
        )
        sighting_date = datetime.fromtimestamp(min(f.stat().st_mtime for f in files)).date()

        self.stats["created"] += 1
        self.stdout.write(f"  {marker} -> {behaviour} ({len(files)} images)")

        if self.dry_run:
            for f in files:
                self._store(f, "photo", marker)
                self._store(f, "gallery", marker)
            return

        now = timezone.now()
        contribution = Contribution.objects.create(
            user=self.user,
            type="marine_sighting",
            status="verified",
            title=title[:300],
            author="Macaulay Library",
            notes=notes,
            safety_status="SAFE",
            moderation_decision="APPROVED",
            visibility_status="COMMUNITY_VISIBLE",
            submitted_at=now,
            verified_at=now,
            metadata={
                "source_folder": marker,
                "source": "Macaulay Library",
                "species_group": config["species_group"],
                "behaviour": label,
                "files": [f.name for f in files],
            },
        )
        sighting = MarineSighting.objects.create(
            contribution=contribution,
            category=category,
            ai_species_suggestion=config["ai_suggestion"],
            photo=self._store(files[0], "photo", marker),
            behavior=behaviour,
            sighting_date=sighting_date,
            notes=f"<p>{label} — {config['species_common']} behaviour. Photos: Macaulay Library.</p>",
        )
        for idx, f in enumerate(files):
            rel = self._store(f, "gallery", marker)
            if rel:
                SightingImage.objects.create(
                    sighting=sighting,
                    image=rel,
                    caption=f"{label} — {f.stem}"[:200],
                    sort_order=idx,
                )
                self.stats["images"] += 1

    def _store(self, source_path, kind, marker):
        """Copy source file into MEDIA_ROOT/sightings/[gallery/]<category>/<behaviour>/ and return the relative path."""
        relative = f"sightings/{'gallery/' if kind == 'gallery' else ''}{marker}/{source_path.name}".replace("\\", "/")
        target = self.media_root / relative
        if self.dry_run:
            if not target.exists() or target.stat().st_size != source_path.stat().st_size:
                self.stats["copied"] += 1
                self.stats["bytes"] += source_path.stat().st_size
            return relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.stat().st_size != source_path.stat().st_size:
            shutil.copy2(source_path, target)
            self.stats["copied"] += 1
            self.stats["bytes"] += source_path.stat().st_size
        return relative

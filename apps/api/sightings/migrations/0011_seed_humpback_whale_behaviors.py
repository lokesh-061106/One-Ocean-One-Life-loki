# Seed the Humpback Whale (Macaulay Library) behaviour reference rows.
# These behaviours are used by the seed_sightings_behaviors command and shown
# in the Marine Sighting admin dropdown (Sightings -> Behaviors).

from django.db import migrations

BEHAVIORS = [
    ("Cooperative Feeding", "cooperative-feeding", 42),
    ("Diving", "diving", 43),
    ("High Fluking Dive", "high-fluking-dive", 44),
    ("Kickfeeding", "kickfeeding", 45),
]


def seed_behaviors(apps, schema_editor):
    SightingBehavior = apps.get_model("sightings", "SightingBehavior")
    for name, slug, sort_order in BEHAVIORS:
        SightingBehavior.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "sort_order": sort_order},
        )


def remove_behaviors(apps, schema_editor):
    SightingBehavior = apps.get_model("sightings", "SightingBehavior")
    SightingBehavior.objects.filter(slug__in=[slug for _, slug, _ in BEHAVIORS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('sightings', '0010_seed_gray_whale_behaviors'),
    ]

    operations = [
        migrations.RunPython(seed_behaviors, remove_behaviors),
    ]

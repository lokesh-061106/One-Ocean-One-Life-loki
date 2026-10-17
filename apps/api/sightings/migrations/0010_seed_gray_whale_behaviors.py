# Seed the Gray Whale (Macaulay Library) behaviour reference rows.
# These behaviours are used by the seed_sightings_behaviors command and shown
# in the Marine Sighting admin dropdown (Sightings -> Behaviors).

from django.db import migrations

BEHAVIORS = [
    ("Flippering", "flippering", 37),
    ("Logging", "logging", 38),
    ("Low Fluking Dive", "low-fluking-dive", 39),
    ("Snaking", "snaking", 40),
    ("Spouting", "spouting", 41),
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
        ('sightings', '0009_sightingbehavior_alter_marinesighting_behavior'),
    ]

    operations = [
        migrations.RunPython(seed_behaviors, remove_behaviors),
    ]

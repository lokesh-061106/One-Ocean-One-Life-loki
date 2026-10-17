# Seed the Harbor Seal (Macaulay Library) behaviour reference rows.
# These behaviours are used by the seed_sightings_behaviors command and shown
# in the Marine Sighting admin dropdown (Sightings -> Behaviors).

from django.db import migrations

BEHAVIORS = [
    ("Surface Floating", "surface-floating", 62),
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
        ('sightings', '0013_alter_marinesighting_photo_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_behaviors, remove_behaviors),
    ]

# Seed the Sea Otter (Macaulay Library) behaviour reference rows.
# These behaviours are used by the seed_sightings_behaviors command and shown
# in the Marine Sighting admin dropdown (Sightings -> Behaviors).

from django.db import migrations

BEHAVIORS = [
    ("Climbing Buoy", "climbing-buoy", 63),
    ("Close Contact", "close-contact", 64),
    ("Close Contact Grooming", "close-contact-grooming", 65),
    ("Feeding Octopus", "feeding-octopus", 66),
    ("Feeding Sea Urchin", "feeding-sea-urchin", 67),
    ("Floating Grooming", "floating-grooming", 68),
    ("Floating Resting", "floating-resting", 69),
    ("Prey Handling", "prey-handling", 70),
    ("Prey Handling Crab", "prey-handling-crab", 71),
    ("Supine Floating", "supine-floating", 72),
    ("Surface Swimming Splashing", "surface-swimming-splashing", 73),
    ("Underwater Close Contact", "underwater-close-contact", 74),
    ("Underwater Swimming", "underwater-swimming", 75),
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
        ('sightings', '0014_seed_harbor_seal_behaviors'),
    ]

    operations = [
        migrations.RunPython(seed_behaviors, remove_behaviors),
    ]

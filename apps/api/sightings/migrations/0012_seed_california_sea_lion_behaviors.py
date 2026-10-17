# Seed the California Sea Lion (Macaulay Library) behaviour reference rows.
# These behaviours are used by the seed_sightings_behaviors command and shown
# in the Marine Sighting admin dropdown (Sightings -> Behaviors).

from django.db import migrations

BEHAVIORS = [
    ("Chasing Prey", "chasing-prey", 46),
    ("Colony Hauled Out", "colony-hauled-out", 47),
    ("Floating Flipper Raised", "floating-flipper-raised", 48),
    ("Group Rafting", "group-rafting", 49),
    ("Head Raising", "head-raising", 50),
    ("Inspecting Buoy", "inspecting-buoy", 51),
    ("Leaping", "leaping", 52),
    ("Leaping From Water", "leaping-from-water", 53),
    ("Open Mouth Display", "open-mouth-display", 54),
    ("Prey Handling Fish", "prey-handling-fish", 55),
    ("Raising Flipper", "raising-flipper", 56),
    ("Scratching Grooming", "scratching-grooming", 57),
    ("Social Interaction", "social-interaction", 58),
    ("Surfacing Together", "surfacing-together", 59),
    ("Vocalizing Hauled Out", "vocalizing-hauled-out", 60),
    ("Vocalizing Near Cormorants", "vocalizing-near-cormorants", 61),
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
        ('sightings', '0011_seed_humpback_whale_behaviors'),
    ]

    operations = [
        migrations.RunPython(seed_behaviors, remove_behaviors),
    ]

"""
Backfill one clearly-labelled aggregate contribution row per imported member
whose lifetime workbook total exceeds the sum of their itemised rows.

The workbook's Contributions sheet only holds a ~2-row sample per member, while
the Recognition_Leaderboard sheet carries the authoritative lifetime totals
(stored in profile.metadata['leaderboard']). This command closes that gap so
every lifetime total is displayed one-by-one on the contributor page:

    python manage.py backfill_legacy_contributions
    python manage.py backfill_legacy_contributions --dry-run

Creates a single verified row (external_id LEGACY-<username>, B=gap, Q=V=I=1)
representing the un-itemised remainder. Idempotent: re-running updates the
existing row's points if the gap changed, and never creates duplicates.
"""
from django.core.management.base import BaseCommand
from django.db.models import Count, FloatField, Sum, Value
from django.db.models.functions import Coalesce

from contributions.models import Contribution


class Command(BaseCommand):
    help = "Backfill aggregate legacy contribution rows so lifetime totals are itemised."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Report what would be created/updated without writing.',
        )

    def handle(self, *args, **options):
        dry = options['dry_run']
        from accounts.models import User

        created = updated = skipped = 0
        rows = []

        users = User.objects.filter(profile__metadata__leaderboard__isnull=False).select_related(
            'profile',
        ).distinct()

        for user in users:
            seed = (user.profile.metadata or {}).get('leaderboard') or {}
            seed_points = float(seed.get('total_score_points') or 0)
            seed_verified = int(seed.get('verified_contributions') or 0)
            if seed_points <= 0:
                skipped += 1
                continue

            listed = Contribution.objects.filter(user=user, status='verified')
            agg = listed.aggregate(
                pts=Coalesce(Sum('final_score_points'), Value(0.0), output_field=FloatField()),
                n=Count('id'),
            )
            listed_points = float(agg['pts'] or 0)
            listed_rows = agg['n'] or 0

            gap_points = round(seed_points - listed_points, 2)
            gap_count = max(seed_verified - listed_rows, 0)
            if gap_points <= 0:
                skipped += 1
                continue

            title = (
                f"Legacy verified records - {gap_count} contributions (community workbook)"
                if gap_count > 0
                else "Legacy verified records - workbook point remainder (community workbook)"
            )
            defaults = {
                'type': 'local_knowledge',
                'status': 'verified',
                'title': title,
                'base_points': gap_points,
                'q_quality': 1,
                'v_verification': 1,
                'i_impact': 1,
                'final_score_points': gap_points,
                'points': int(round(gap_points)),
                'visibility_status': 'COMMUNITY_VISIBLE',
                'moderation_decision': 'APPROVED',
                'safety_status': 'SAFE',
                'relevance_level': 'relevant',
                'verified_at': None,
                'notes': (
                    'Represents verified contributions recorded in the community '
                    'workbook lifetime totals but never itemised as individual rows.'
                ),
                'metadata': {
                    'legacy_backfill': True,
                    'source': 'workbook Recognition_Leaderboard aggregate',
                    'seed_points': seed_points,
                    'seed_verified': seed_verified,
                    'listed_rows_before': listed_rows,
                },
            }
            rows.append((user, gap_points, gap_count, title))
            if dry:
                created += 1
                continue
            obj, was_created = Contribution.objects.get_or_create(
                external_id=f'LEGACY-{user.username}'[:20],
                defaults={'user': user, **defaults},
            )
            if was_created:
                created += 1
            else:
                changed = False
                for field, value in defaults.items():
                    if field == 'metadata':
                        continue
                    if getattr(obj, field) != value:
                        setattr(obj, field, value)
                        changed = True
                if changed:
                    obj.save()
                    updated += 1
                else:
                    skipped += 1

        verb = 'Would create' if dry else 'Created'
        for user, gap_points, gap_count, title in rows[:15]:
            self.stdout.write(
                f"  {user.username}: +{gap_points:g} pts ({gap_count} records) — {title}"
            )
        if len(rows) > 15:
            self.stdout.write(f"  ... and {len(rows) - 15} more")
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} {created} aggregate rows, updated {updated}, "
                f"skipped {skipped} (already itemised)"
                + (" [dry-run]" if dry else "")
            )
        )

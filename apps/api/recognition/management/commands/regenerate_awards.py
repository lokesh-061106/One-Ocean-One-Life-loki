"""
Rebuild RecognitionAward rows from the current scoreboard.

    python manage.py regenerate_awards
    python manage.py regenerate_awards --year 2026

Top 3 per state (rank 1 Data Contributor, ranks 2-3 Community Champion)
plus a Marketplace Eligible award for every member past the gate.
"""
from django.core.management.base import BaseCommand

from recognition.services import ensure_badges, ensure_tiers, regenerate_awards, refresh_all_scores


class Command(BaseCommand):
    help = "Regenerate recognition awards from the current scoreboard totals."

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, default=None, help='Award year (default: current year)')

    def handle(self, *args, **options):
        ensure_tiers()
        ensure_badges()
        # tiers/badges and marketplace eligibility may have changed — refresh first
        refresh_all_scores()
        created = regenerate_awards(year=options['year'])
        self.stdout.write(self.style.SUCCESS(f'Regenerated {created} awards'))

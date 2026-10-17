"""
Scoreboard service — recomputes a contributor's scoreboard record.

Primary number:  total_score = B × Q × V × I points (sum of contribution final scores)
Secondary:       profile_score = 7-factor weighted score 0..100 (contributions/scoring_engine.py)
Earnings:        DataSale payouts after platform fee
Tier:            Bronze 10 / Silver 25 / Gold 50 / Platinum 100 / Ocean Guardian 250 verified
"""
from datetime import timedelta

from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from contributions.scoring import (
    MARKETPLACE_ELIGIBILITY_THRESHOLD,
)
from .models import BadgeDefinition, ContributionScore, LeaderboardSnapshot, TierThreshold

DEFAULT_TIERS = [
    {'key': 'new', 'name': 'New Explorer', 'min_verified': 0, 'min_points': 0, 'color': '#94A3B8', 'icon': '🌊', 'order': 0,
     'unlocks': 'Profile, map and first contribution'},
    {'key': 'bronze', 'name': 'Bronze', 'min_verified': 10, 'min_points': 0, 'color': '#CD7F32', 'icon': '🥉', 'order': 1,
     'unlocks': 'Community badge and progress tracking'},
    {'key': 'silver', 'name': 'Silver', 'min_verified': 25, 'min_points': 0, 'color': '#94A3B8', 'icon': '🥈', 'order': 2,
     'unlocks': 'Marketplace eligibility — sell verified data'},
    {'key': 'gold', 'name': 'Gold', 'min_verified': 50, 'min_points': 0, 'color': '#F59E0B', 'icon': '🥇', 'order': 3,
     'unlocks': 'Priority verification and profile highlight'},
    {'key': 'platinum', 'name': 'Platinum', 'min_verified': 100, 'min_points': 0, 'color': '#64748B', 'icon': '💠', 'order': 4,
     'unlocks': 'Featured contributor and ambassador invites'},
    {'key': 'ocean_guardian', 'name': 'Ocean Guardian', 'min_verified': 250, 'min_points': 0, 'color': '#087EA4', 'icon': '🐋', 'order': 5,
     'unlocks': 'Ocean Guardian recognition and annual award eligibility'},
]

DEFAULT_BADGES = [
    {'key': 'community_contributor', 'name': 'Community Contributor', 'icon': '🤝', 'color': '#16A085',
     'criteria': '10 or more verified contributions'},
    {'key': 'ocean_champion', 'name': 'Ocean Champion', 'icon': '🐋', 'color': '#087EA4',
     'criteria': '50 or more verified contributions'},
    {'key': 'market_eligible', 'name': 'Market-Eligible', 'icon': '🏪', 'color': '#F59E0B',
     'criteria': 'Reached 25 verified contributions — marketplace unlocked'},
    {'key': 'trusted_data_seller', 'name': 'Trusted Data Seller', 'icon': '💰', 'color': '#10B981',
     'criteria': 'At least one completed and paid data sale'},
    {'key': 'top_observer', 'name': 'Top Observer', 'icon': '👁', 'color': '#3B82F6',
     'criteria': 'Among the top 50 point earners in the state'},
]


def ensure_tiers():
    """Create or update the default tier ladder (idempotent)."""
    for t in DEFAULT_TIERS:
        TierThreshold.objects.update_or_create(key=t['key'], defaults=t)
    return TierThreshold.objects.all()


def ensure_badges():
    for b in DEFAULT_BADGES:
        BadgeDefinition.objects.update_or_create(key=b['key'], defaults=b)
    return BadgeDefinition.objects.all()


def tier_for(verified, points=0):
    """Highest tier whose thresholds are met."""
    chosen = DEFAULT_TIERS[0]
    for t in DEFAULT_TIERS:
        if verified >= t['min_verified'] and points >= t['min_points']:
            chosen = t
    return chosen['key']


def next_tier(verified):
    for t in DEFAULT_TIERS:
        if verified < t['min_verified']:
            return t
    return None


def refresh_user_score(user):
    from contributions.models import Contribution
    from marketplace.models import AgencyReferral, DataSale

    contribs = Contribution.objects.filter(user=user)

    totals = contribs.aggregate(
        total=Count('id'),
        verified=Count('id', filter=Q(status='verified')),
    )
    points = (
        contribs.filter(status='verified').aggregate(
            s=Coalesce(Sum('final_score_points'), Value(0.0), output_field=DecimalField())
        )['s']
        or 0
    )

    verified = totals['verified'] or 0
    total = totals['total'] or 0

    profile = None
    if hasattr(user, 'profile'):
        try:
            profile = user.profile
        except Exception:
            profile = None
    village = profile.village if profile else None
    if village and village.district:
        state = village.district.state
    elif profile and profile.metadata:
        state = profile.metadata.get('state', '')
    else:
        state = ''
    region = village.region if village else None

    # Workbook lifetime records (written by import_contributor_db into
    # profile.metadata['leaderboard']) are the authoritative totals for
    # imported members — the Contributions sheet only holds a ~2-row sample
    # per member. Floor points, counts and earnings at those figures so a
    # refresh can never collapse a member's real record to the sample sum.
    seed = (profile.metadata or {}).get('leaderboard') if profile else None
    if seed:
        seed_points = float(seed.get('total_score_points') or 0)
        if seed_points > float(points):
            points = seed_points
        verified = max(verified, int(seed.get('verified_contributions') or 0))
        total = max(total, verified)

    # Quality average over verified contributions (Q multiplier)
    qual = (
        contribs.filter(status='verified').aggregate(
            a=Coalesce(Sum('q_quality'), Value(0.0), output_field=DecimalField())
        )['a']
        or 0
    )
    quality_avg = float(qual) / (totals['verified'] or 0) if totals['verified'] else 0.0

    # Earnings from completed data sales
    sales = DataSale.objects.filter(seller=user)
    paid = sales.filter(payment_status='paid')
    earned = paid.aggregate(
        s=Coalesce(Sum('contributor_earning_inr'), Value(0.0), output_field=DecimalField())
    )['s'] or 0
    gross = paid.aggregate(
        s=Coalesce(Sum('gross_inr'), Value(0.0), output_field=DecimalField())
    )['s'] or 0
    items_sold = paid.count()
    agency_referrals = AgencyReferral.objects.filter(contributor=user).count()

    if seed:
        earned = max(float(earned), float(seed.get('contributor_earnings_inr') or 0))
        gross = max(float(gross), float(seed.get('gross_sales_inr') or 0))
        items_sold = max(items_sold, int(seed.get('data_items_sold') or 0))

    eligible = verified >= MARKETPLACE_ELIGIBILITY_THRESHOLD

    # Secondary 7-factor profile score
    from contributions.scoring_engine import calculate_total_score
    try:
        profile_result = calculate_total_score(user)
        profile_score = profile_result['total']
        profile_breakdown = profile_result['breakdown']
    except Exception:
        profile_score = 0
        profile_breakdown = {}

    points_int = int(round(float(points)))
    tier_key = tier_for(verified, points_int)

    badges = []
    if verified >= 10:
        badges.append('community_contributor')
    if verified >= 50:
        badges.append('ocean_champion')
    if eligible:
        badges.append('market_eligible')
    if items_sold > 0:
        badges.append('trusted_data_seller')

    score, _created = ContributionScore.objects.update_or_create(
        user=user,
        defaults={
            'total_score': points_int,
            'profile_score': profile_score,
            'verified_contributions': verified,
            'total_contributions': total,
            'quality_average': round(quality_avg, 3),
            'breakdown': {'quality_avg': round(quality_avg, 3), 'profile': profile_breakdown},
            'state': state or '',
            'coastal_region': region,
            'data_items_sold': items_sold,
            'gross_sales_inr': int(round(float(gross))),
            'earnings_inr': int(round(float(earned))),
            'marketplace_eligible': eligible,
            'agency_referrals': agency_referrals,
            'tier': tier_key,
            'badges': badges,
            'last_calculated': timezone.now(),
        },
    )

    if profile is not None:
        profile.__class__.objects.filter(pk=profile.pk).update(
            contribution_score=points_int,
            total_contributions=total,
            total_verified=verified,
        )

    return {
        'total': float(points_int),
        'profile': profile_score,
        'breakdown': {'quality_avg': round(quality_avg, 3), 'profile': profile_breakdown},
        'verified': verified,
        'earned': int(round(float(earned))),
    }


def _rank_movement(level, scope_key, ordered_ids):
    """Compare against yesterday's snapshot to derive ↑ / ↓ movement."""
    yesterday = timezone.now().date() - timedelta(days=1)
    prev = {
        s.subject_id: s.rank
        for s in LeaderboardSnapshot.objects.filter(
            level=level, scope_key=scope_key, captured_on=yesterday
        )
    }
    movements = {}
    for idx, key in enumerate(ordered_ids, start=1):
        old = prev.get(key)
        movements[key] = (old - idx) if old else 0
    return movements


def capture_snapshot(level, scope_key, scope_label, rows):
    """Persist today's ranks so the next refresh can show movement."""
    today = timezone.now().date()
    LeaderboardSnapshot.objects.filter(
        level=level, scope_key=scope_key, captured_on=today
    ).delete()
    bulk = [
        LeaderboardSnapshot(
            level=level,
            scope_key=scope_key,
            scope_label=scope_label,
            subject_id=str(r['subject_id']),
            subject_name=r['subject_name'],
            rank=r['rank'],
            total_score=r['total_score'],
            earnings_inr=r.get('earnings_inr', 0),
            captured_on=today,
        )
        for r in rows
    ]
    LeaderboardSnapshot.objects.bulk_create(bulk)


def refresh_all_scores(user_ids=None):
    from accounts.models import User

    users = User.objects.filter(is_active=True)
    if user_ids:
        users = users.filter(id__in=user_ids)

    updated = 0
    for user in users.iterator():
        try:
            refresh_user_score(user)
            updated += 1
        except Exception as exc:  # noqa: BLE001 — keep the bulk job alive
            print(f"score refresh failed for {user.username}: {exc}")
    return updated


def regenerate_awards(year=None):
    """Rebuild RecognitionAward rows from the current scoreboard.

    Top 3 per state (rank 1 Data Contributor, ranks 2–3 Community Champion)
    plus a Marketplace Eligible award for every member past the gate.
    Replaces all existing awards for the year.
    """
    from collections import defaultdict

    from django.utils import timezone

    from .models import RecognitionAward

    year = year or timezone.now().year
    RecognitionAward.objects.filter(year=year).delete()

    by_state = defaultdict(list)
    for s in ContributionScore.objects.select_related('user').filter(state__gt=''):
        by_state[s.state].append(s)

    created = 0
    for state, rows in by_state.items():
        rows.sort(key=lambda x: (-x.total_score, -x.verified_contributions, x.user.username))
        for position, score in enumerate(rows[:3], start=1):
            RecognitionAward.objects.create(
                user=score.user,
                category='data_contributor' if position == 1 else 'community_champion',
                year=year,
                title=f"{state} Rank #{position} Contributor {year}",
                description=(
                    f"Ranked #{position} in {state} with "
                    f"{score.total_score} score points and "
                    f"{score.verified_contributions} verified contributions."
                ),
                village=getattr(getattr(score.user, 'profile', None), 'village', None),
                score=score.total_score,
                rank=position,
            )
            created += 1

    for score in ContributionScore.objects.select_related('user').filter(
        marketplace_eligible=True,
    ):
        RecognitionAward.objects.get_or_create(
            user=score.user,
            title=f"Marketplace Eligible Contributor {year}",
            defaults={
                'category': 'marine_guardian',
                'year': year,
                'description': (
                    f'Cleared the {MARKETPLACE_ELIGIBILITY_THRESHOLD} verified contribution gate — '
                    'their data can be licensed on the O3L marketplace.'
                ),
                'village': getattr(getattr(score.user, 'profile', None), 'village', None),
                'score': score.total_score,
            },
        )
        created += 1

    return created

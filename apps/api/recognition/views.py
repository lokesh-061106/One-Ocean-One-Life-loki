import math
import re

from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce
from django.http import Http404
from rest_framework import generics, permissions, response, status
from rest_framework.views import APIView

from accounts.models import Profile
from locations.models import CoastalRegion

from .models import BadgeDefinition, ContributionScore, RecognitionAward, TierThreshold
from .serializers import (
    BadgeDefinitionSerializer,
    ContributionScoreSerializer,
    LeaderboardSerializer,
    RecognitionAwardSerializer,
    TierThresholdSerializer,
)
from .services import DEFAULT_TIERS, MARKETPLACE_ELIGIBILITY_THRESHOLD, next_tier, refresh_user_score

BOARD_LIMIT = 50

LEVEL_CHOICES = ('individual', 'village', 'district', 'state', 'region', 'zone')


class RecognitionAwardListView(generics.ListAPIView):
    serializer_class = RecognitionAwardSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'year', 'zone']
    ordering_fields = ['score', 'rank']
    queryset = RecognitionAward.objects.select_related('user', 'village', 'zone').all()


class ContributionScoreListView(generics.ListAPIView):
    serializer_class = ContributionScoreSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ContributionScore.objects.select_related('user', 'coastal_region').all()


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def _annotate_rank(qs, request):
    """Attach a 1-based rank to each ContributionScore row (already ordered)."""
    limit = min(int(request.query_params.get('limit', BOARD_LIMIT) or BOARD_LIMIT), 200)
    rows = list(qs[:limit])
    for idx, row in enumerate(rows, start=1):
        row.rank = idx
        row.prev_rank = row.prev_rank
    return rows


def _aggregate_rows(group_qs, level, request, label_key, scope_key_fn):
    """
    Build a scoreboard row per group (village / district / state / region / zone).
    Each row: {rank, scope_key, label, points, members, verified, earnings, ...}
    """
    limit = min(int(request.query_params.get('limit', BOARD_LIMIT) or BOARD_LIMIT), 200)
    grouped = (
        group_qs.values(*scope_key_fn['fields'])
        .annotate(
            points=Coalesce(Sum('total_score'), Value(0)),
            members=Count('id'),
            verified=Coalesce(Sum('verified_contributions'), Value(0)),
            sold=Coalesce(Sum('data_items_sold'), Value(0)),
            gross=Coalesce(Sum('gross_sales_inr'), Value(0)),
            earnings=Coalesce(Sum('earnings_inr'), Value(0)),
            eligible=Count('id', filter=_marketplace_q()),
        )
        .order_by('-points')
    )[:limit]

    rows = []
    for idx, g in enumerate(grouped, start=1):
        row = {
            'rank': idx,
            'rank_movement': 0,
            'level': level,
            'scope_key': scope_key_fn['key'](g),
            'label': label_key(g),
            'total_score': g['points'],
            'members': g['members'],
            'verified_contributions': g['verified'],
            'data_items_sold': g['sold'],
            'gross_sales_inr': g['gross'],
            'earnings_inr': g['earnings'],
            'marketplace_eligible_members': g['eligible'],
            'avg_score': round(g['points'] / g['members'], 1) if g['members'] else 0,
        }
        for source, target in (
            ('coastal_region__state', 'state'),
            ('user__profile__village__district__state', 'state'),
            ('state', 'state'),
        ):
            if source in g and g[source]:
                row[target] = g[source]
                break
        rows.append(row)
    return rows


def _marketplace_q():
    from django.db.models import Q

    return Q(marketplace_eligible=True)


# --------------------------------------------------------------------------
# leaderboard — level aware
# --------------------------------------------------------------------------

class LeaderboardView(APIView):
    """
    GET /recognition/leaderboard/
        ?level=individual|village|district|state|region|zone
        &state=Tamil Nadu   (filter for state/region/village/district boards)
        &zone=<zone-slug>
        &limit=50
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        level = request.query_params.get('level', 'individual')
        if level not in LEVEL_CHOICES:
            level = 'individual'

        if level == 'individual':
            return response.Response(self._individual(request))
        return response.Response(self._grouped(request, level))

    # -- individual -------------------------------------------------------
    def _individual(self, request):
        qs = (
            ContributionScore.objects
            .select_related('user', 'user__profile', 'coastal_region')
            .filter(total_score__gt=0)
            .order_by('-total_score', '-verified_contributions')
        )
        state = request.query_params.get('state')
        zone = request.query_params.get('zone')
        if state:
            qs = qs.filter(state__iexact=state)
        if zone:
            qs = qs.filter(user__profile__village__district__zone__slug=zone)

        limit = min(int(request.query_params.get('limit', BOARD_LIMIT) or BOARD_LIMIT), 200)
        rows = list(qs[:limit])
        for idx, row in enumerate(rows, start=1):
            row.rank = idx

        payload = LeaderboardSerializer(rows, many=True).data

        # attach rank movement from the last individual snapshot
        try:
            from datetime import timedelta
            from django.utils import timezone

            from .models import LeaderboardSnapshot

            yesterday = timezone.now().date() - timedelta(days=1)
            prev = {
                s.subject_id: s.rank
                for s in LeaderboardSnapshot.objects.filter(
                    level='individual', scope_key='global', captured_on=yesterday
                )
            }
            for item, row in zip(payload, rows):
                old = prev.get(str(row.user_id))
                item['rank_movement'] = (old - row.rank) if old else 0
        except Exception:
            pass

        return payload

    # -- grouped ----------------------------------------------------------
    def _grouped(self, request, level):
        base = ContributionScore.objects.all()

        state = request.query_params.get('state')
        if state:
            base = base.filter(state__iexact=state)

        if level == 'village':
            base = base.filter(user__profile__village__isnull=False)

            def label(g):
                return g['user__profile__village__name']

            return _aggregate_rows(
                base, level, request, label,
                {
                    'fields': ['user__profile__village__id', 'user__profile__village__name'],
                    'key': lambda g: str(g['user__profile__village__id']),
                },
            )

        if level == 'district':
            base = base.filter(user__profile__village__district__isnull=False)

            def label(g):
                return g['user__profile__village__district__name']

            return _aggregate_rows(
                base, level, request, label,
                {
                    'fields': [
                        'user__profile__village__district__id',
                        'user__profile__village__district__name',
                        'user__profile__village__district__state',
                    ],
                    'key': lambda g: str(g['user__profile__village__district__id']),
                },
            )

        if level == 'state':
            base = base.filter(state__gt='')

            def label(g):
                return g['state']

            return _aggregate_rows(
                base, level, request, label,
                {'fields': ['state'], 'key': lambda g: g['state']},
            )

        if level == 'region':
            base = base.filter(coastal_region__isnull=False)

            def label(g):
                return f"{g['coastal_region__name']} ({g['coastal_region__state']})"

            return _aggregate_rows(
                base, level, request, label,
                {
                    'fields': ['coastal_region__id', 'coastal_region__name', 'coastal_region__state'],
                    'key': lambda g: str(g['coastal_region__id']),
                },
            )

        # zone
        base = base.filter(user__profile__village__district__zone__isnull=False)

        def label(g):
            return g['user__profile__village__district__zone__name']

        return _aggregate_rows(
            base, level, request, label,
            {
                'fields': [
                    'user__profile__village__district__zone__id',
                    'user__profile__village__district__zone__name',
                    'user__profile__village__district__zone__slug',
                ],
                'key': lambda g: g['user__profile__village__district__zone__slug'],
            },
        )


# --------------------------------------------------------------------------
# my score / my awards — these two endpoints the web app already calls
# --------------------------------------------------------------------------

class MyScoreView(APIView):
    """GET /recognition/scores/me/ — full B×Q×V×I breakdown + earnings + tier."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # side effect only — recomputes and persists this user's score row
            refresh_user_score(request.user)
        except Exception:
            pass

        obj = ContributionScore.objects.filter(user=request.user).first()
        verified = obj.verified_contributions if obj else 0
        nxt = next_tier(verified)

        return response.Response({
            'total_score': obj.total_score if obj else 0,
            'profile_score': obj.profile_score if obj else 0,
            'verified_contributions': verified,
            'total_contributions': obj.total_contributions if obj else 0,
            'quality_average': obj.quality_average if obj else 0,
            'breakdown': obj.breakdown if obj else {},
            'state': obj.state if obj else '',
            'coastal_region': obj.coastal_region.name if obj and obj.coastal_region else None,
            'tier': obj.tier if obj else 'new',
            'tier_info': next((t for t in DEFAULT_TIERS if t['key'] == (obj.tier if obj else 'new')), DEFAULT_TIERS[0]),
            'next_tier': nxt,
            'next_tier_progress': (
                round(min(verified / nxt['min_verified'], 1.0) * 100, 1) if nxt else 100
            ),
            'badges': obj.badges if obj else [],
            'data_items_sold': obj.data_items_sold if obj else 0,
            'gross_sales_inr': obj.gross_sales_inr if obj else 0,
            'earnings_inr': obj.earnings_inr if obj else 0,
            'marketplace_eligible': obj.marketplace_eligible if obj else False,
            'marketplace_threshold': MARKETPLACE_ELIGIBILITY_THRESHOLD,
            'marketplace_progress': round(
                min(verified / MARKETPLACE_ELIGIBILITY_THRESHOLD, 1.0) * 100, 1
            ),
            'agency_referrals': obj.agency_referrals if obj else 0,
            'rank': obj.rank if obj else None,
            'last_calculated': obj.last_calculated if obj else None,
            'formula': 'Final Score = B × Q × V × I',
        })


class ContributorRecognitionView(APIView):
    """GET /recognition/contributors/<slug>/ — public recognition profile.

    Accepts the contributor slug (e.g. ``lakshmi-r-f37216``) or the raw user
    UUID, so old links keep working.

    Explains *how* a contributor got their standing: the resolved tier and
    next tier, the badges they actually hold (with criteria), any awards, the
    marketplace gate progress, and the verified contributions that produced the
    score — each showing its own B × Q × V × I breakdown.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, contributor):
        from django.core.exceptions import ValidationError as DjangoValidationError
        from django.shortcuts import get_object_or_404

        from contributions.models import Contribution

        # slug first (the canonical form), UUID kept as a back-compat fallback
        qs = ContributionScore.objects.select_related('user', 'coastal_region')
        try:
            score = get_object_or_404(qs, slug=contributor)
        except (Http404, DjangoValidationError):
            try:
                score = get_object_or_404(qs, user_id=contributor)
            except (Http404, DjangoValidationError, ValueError, TypeError):
                raise Http404('No contributor matches the given identifier.')
        user = score.user
        if not user.is_active:
            return response.Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # ranks — global and within state
        global_rank = (
            ContributionScore.objects.filter(total_score__gt=score.total_score).count() + 1
        )
        state_rank = state_members = None
        if score.state:
            state_qs = ContributionScore.objects.filter(state=score.state)
            state_members = state_qs.count()
            state_rank = state_qs.filter(total_score__gt=score.total_score).count() + 1

        # tier ladder
        tier_info = next((t for t in DEFAULT_TIERS if t['key'] == score.tier), None)
        nxt = next_tier(score.verified_contributions)

        # badges this contributor actually holds, with their definitions
        held = set(score.badges or [])
        badge_defs = list(
            BadgeDefinition.objects.filter(key__in=held).values(
                'key', 'name', 'description', 'icon', 'color', 'criteria',
            )
        )

        awards = RecognitionAward.objects.filter(user=user).select_related(
            'village', 'zone',
        ).order_by('-year', '-score')

        # the verified records that produced the score
        contribs = list(
            Contribution.objects.filter(user=user, status='verified').order_by(
                '-final_score_points', '-verified_at',
            )[:50].values(
                'id', 'type', 'title', 'base_points', 'q_quality', 'v_verification',
                'i_impact', 'final_score_points', 'verified_at', 'created_at',
                'catalogue_type__catalogue_id',
            )
        )
        for c in contribs:
            c['type_display'] = dict(Contribution.TYPE_CHOICES).get(c['type'], c['type'])
            c['catalogue_id'] = c.pop('catalogue_type__catalogue_id', None)

        return response.Response({
            'user': str(user.id),
            'slug': score.slug,
            'user_name': user.username,
            'display_name': (f"{user.first_name} {user.last_name}".strip() or user.username),
            'occupation': getattr(getattr(user, 'profile', None), 'occupation', None),
            'village_name': getattr(getattr(user, 'profile', None), 'village', None) and user.profile.village.name,
            'district_name': (
                user.profile.village.district.name
                if getattr(getattr(user, 'profile', None), 'village', None) and user.profile.village.district
                else None
            ),
            'state': score.state,
            'region_name': score.coastal_region.name if score.coastal_region else None,

            'global_rank': global_rank,
            'state_rank': state_rank,
            'state_members': state_members,

            'total_score': score.total_score,
            'profile_score': score.profile_score,
            'verified_contributions': score.verified_contributions,
            'total_contributions': score.total_contributions,
            'quality_average': score.quality_average,

            'data_items_sold': score.data_items_sold,
            'gross_sales_inr': score.gross_sales_inr,
            'earnings_inr': score.earnings_inr,
            'marketplace_eligible': score.marketplace_eligible,
            'agency_referrals': score.agency_referrals,

            'tier': score.tier,
            'tier_display': tier_info['name'] if tier_info else score.tier,
            'tier_info': tier_info,
            'next_tier': nxt,
            'next_tier_progress': round(
                min(score.verified_contributions / nxt['min_verified'], 1.0) * 100, 1
            ) if nxt else 100.0,
            'marketplace_threshold': MARKETPLACE_ELIGIBILITY_THRESHOLD,
            'marketplace_progress': round(
                min(score.verified_contributions / MARKETPLACE_ELIGIBILITY_THRESHOLD, 1.0) * 100, 1
            ),

            'badges': score.badges or [],
            'badge_info': badge_defs,
            'awards': RecognitionAwardSerializer(awards, many=True).data,
            'contributions': contribs,
            'contributions_shown': len(contribs),
            'formula': 'Final Score = B × Q × V × I',
            'last_calculated': score.last_calculated,
        })


class MyAwardsView(APIView):
    """GET /recognition/awards/me/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = RecognitionAward.objects.filter(user=request.user).select_related('village', 'zone')
        return response.Response(RecognitionAwardSerializer(qs, many=True).data)


class MyRankView(APIView):
    """GET /recognition/scores/me/rank/ — where do I sit on my state board?"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        score = ContributionScore.objects.filter(user=request.user).first()
        if not score:
            return response.Response({'rank': None, 'level': 'individual'})
        state_qs = ContributionScore.objects.filter(state=score.state).order_by('-total_score')
        rank = list(state_qs.values_list('id', flat=True)).index(score.id) + 1
        return response.Response({
            'state': score.state,
            'state_rank': rank,
            'state_members': state_qs.count(),
            'total_score': score.total_score,
            'tier': score.tier,
        })


# --------------------------------------------------------------------------
# tiers / badges / catalogue / summary / regions / awareness / nearby
# --------------------------------------------------------------------------

class TierListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = TierThresholdSerializer

    def get_queryset(self):
        from .services import ensure_tiers

        ensure_tiers()
        return TierThreshold.objects.all()


class BadgeListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = BadgeDefinitionSerializer
    queryset = BadgeDefinition.objects.all()


class CatalogueView(APIView):
    """
    GET /recognition/catalogue/
    Contribution types with base points (B) and fixed INR prices — drives
    the 'how much can I earn' table on the scoreboard.
    """
    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _eligibility(description):
        """Workbook rows are stored as '[CT01] Clear photo + ... | Rs.100 | Marketplace'.

        The middle segment is the Eligibility_Description column — return it
        on its own so clients don't have to parse the composite string.
        """
        match = re.match(r'^\[[^\]]+\]\s*(.*?)\s*\|\s*Rs\.', description or '')
        return match.group(1) if match else (description or '')

    def get(self, request):
        from contributions.models import ContributionType

        rows = ContributionType.objects.filter(is_active=True).order_by('catalogue_id', 'name')
        return response.Response([
            {
                'catalogue_id': c.catalogue_id,
                'name': c.name,
                'slug': c.slug,
                'description': c.description,
                'eligibility_description': self._eligibility(c.description),
                'base_points_b': float(c.base_points_b),
                'fixed_price_inr': float(c.fixed_price_inr) if c.fixed_price_inr is not None else None,
                'price_display': c.price_display,
                'reward_channel': c.reward_channel,
                'marketplace_eligible': c.marketplace_eligible,
                'requires_geotag': c.requires_geotag,
                'points_verified': c.points_verified,
            }
            for c in rows
        ])


class ScoreboardSummaryView(APIView):
    """GET /recognition/summary/?state=... — headline numbers for the hero."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = ContributionScore.objects.all()
        state = request.query_params.get('state')
        if state:
            qs = qs.filter(state__iexact=state)

        agg = qs.aggregate(
            members=Count('id'),
            points=Coalesce(Sum('total_score'), Value(0)),
            verified=Coalesce(Sum('verified_contributions'), Value(0)),
            sold=Coalesce(Sum('data_items_sold'), Value(0)),
            gross=Coalesce(Sum('gross_sales_inr'), Value(0)),
            earnings=Coalesce(Sum('earnings_inr'), Value(0)),
            eligible=Count('id', filter=_marketplace_q()),
        )

        by_state = list(
            ContributionScore.objects.filter(state__gt='')
            .values('state')
            .annotate(
                members=Count('id'),
                points=Coalesce(Sum('total_score'), Value(0)),
                earnings=Coalesce(Sum('earnings_inr'), Value(0)),
                verified=Coalesce(Sum('verified_contributions'), Value(0)),
            )
            .order_by('-points')
        )

        return response.Response({
            'contributors': agg['members'],
            'total_points': agg['points'],
            'verified_contributions': agg['verified'],
            'data_items_sold': agg['sold'],
            'gross_sales_inr': agg['gross'],
            'total_earnings_inr': agg['earnings'],
            'marketplace_eligible': agg['eligible'],
            'states': by_state,
            'marketplace_threshold': MARKETPLACE_ELIGIBILITY_THRESHOLD,
        })


class RegionSummaryView(APIView):
    """GET /recognition/regions/ — region-wise rows for the map and table."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        regions = CoastalRegion.objects.all()
        scores = (
            ContributionScore.objects.filter(coastal_region__isnull=False)
            .values('coastal_region_id')
            .annotate(
                points=Coalesce(Sum('total_score'), Value(0)),
                members=Count('id'),
                verified=Coalesce(Sum('verified_contributions'), Value(0)),
                earnings=Coalesce(Sum('earnings_inr'), Value(0)),
                sold=Coalesce(Sum('data_items_sold'), Value(0)),
                eligible=Count('id', filter=_marketplace_q()),
            )
        )
        by_region = {s['coastal_region_id']: s for s in scores}

        rows = []
        for r in regions:
            s = by_region.get(r.id, {})
            members = s.get('members', 0)
            points = s.get('points', 0)
            per_member = round(points / members, 1) if members else 0
            band = 'green' if members >= 8 and points >= 1500 else ('yellow' if members >= 3 else 'red')
            rows.append({
                'id': str(r.id),
                'name': r.name,
                'slug': r.slug,
                'state': r.state,
                'latitude': r.latitude,
                'longitude': r.longitude,
                'members': members,
                'verified_contributions': s.get('verified', 0),
                'total_points': points,
                'data_items_sold': s.get('sold', 0),
                'earnings_inr': s.get('earnings', 0),
                'marketplace_eligible': s.get('eligible', 0),
                'contributions_per_member': per_member,
                'band': band,
                'band_label': {'green': 'Active coastal region', 'yellow': 'Needs activation', 'red': 'Priority outreach'}[band],
            })
        rows.sort(key=lambda x: -x['total_points'])
        for idx, row in enumerate(rows, start=1):
            row['rank'] = idx
        return response.Response(rows)


class AwarenessZonesView(APIView):
    """GET /recognition/awareness-zones/ — red/yellow/green outreach map."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from outreach.models import AwarenessZone

        qs = AwarenessZone.objects.select_related('location', 'coastal_region').all()
        state = request.query_params.get('state')
        if state:
            qs = qs.filter(state__iexact=state)
        return response.Response([
            {
                'location_id': str(z.location_id),
                'location': z.location.name if z.location else '',
                'state': z.state,
                'district': z.district,
                'region': z.coastal_region.name if z.coastal_region else None,
                'latitude': z.latitude,
                'longitude': z.longitude,
                'registered_members': z.registered_members,
                'verified_contributions': z.verified_contributions,
                'detailed_contributions': z.detailed_contributions,
                'marketplace_eligible': z.marketplace_eligible,
                'data_items_sold': z.data_items_sold,
                'total_earnings_inr': z.total_earnings_inr,
                'band': z.band,
                'band_label': z.get_band_display(),
                'awareness_gap_percent': z.awareness_gap_percent,
                'recommended_intervention': z.recommended_intervention,
            }
            for z in qs
        ])


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class NearbyContributorsView(APIView):
    """
    GET /recognition/nearby/?lat=..&lng=..&radius_km=10

    Nearest opted-in contributors for the trust-building map card:
      👤 Arulraj M. — 1.8 km, Tharuvaikulam, 32 verified, ₹1,200 earned [Connect]

    Privacy: only village-level location is exposed and only for users who
    ticked "Appear on O3L local contributor map". Earnings respect the
    contributor's show_earnings flag.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return response.Response(
                {'detail': 'lat and lng query params are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        radius = float(request.query_params.get('radius_km', 10))

        profiles = (
            Profile.objects
            .filter(appear_on_map=True, latitude__isnull=False, longitude__isnull=False)
            .exclude(user=request.user)
            .select_related('user', 'village', 'village__district')
        )

        scored = []
        for p in profiles:
            d = _haversine_km(lat, lng, p.latitude, p.longitude)
            if d <= radius:
                scored.append((d, p))
        scored.sort(key=lambda x: x[0])

        rows = []
        for dist, p in scored[:3]:
            cs = ContributionScore.objects.filter(user=p.user).first()
            village_name = p.village.name if (p.show_village and p.village) else 'Nearby coastal village'
            rows.append({
                'user': str(p.user_id),
                'name': f"{p.user.first_name} {p.user.last_name}".strip() or p.user.username,
                'occupation': p.occupation,
                'village': village_name,
                'distance_km': round(dist, 1),
                'verified_contributions': cs.verified_contributions if cs else 0,
                'total_score': cs.total_score if cs else 0,
                'tier': cs.tier if cs else 'new',
                'earnings_inr': (cs.earnings_inr if cs else 0) if p.show_earnings else None,
                'earnings_hidden': not p.show_earnings,
                'marketplace_eligible': bool(cs and cs.marketplace_eligible),
                'can_connect': p.allow_connection_requests,
            })
        return response.Response({'radius_km': radius, 'results': rows})

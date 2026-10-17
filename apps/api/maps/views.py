from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Q
from core.permissions import IsAdmin
from .models import OceanHotspot, EmergencyContact
from .serializers import (
    OceanHotspotSerializer, OceanHotspotGeoJSONSerializer,
    OceanHotspotCreateUpdateSerializer,
    EmergencyContactSerializer, EmergencyContactCreateUpdateSerializer,
)


class OceanHotspotListView(generics.ListAPIView):
    serializer_class = OceanHotspotSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['density_level', 'zone']
    ordering_fields = ['contribution_count', 'quality_score']
    queryset = OceanHotspot.objects.select_related('zone').all()


class OceanHotspotGeoJSONView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = OceanHotspot.objects.select_related('zone').all()

        density = request.query_params.get('density')
        if density:
            qs = qs.filter(density_level=density)

        zone = request.query_params.get('zone')
        if zone:
            qs = qs.filter(zone__slug=zone)

        min_count = request.query_params.get('min_count')
        if min_count:
            qs = qs.filter(contribution_count__gte=int(min_count))

        features = []
        for hotspot in qs:
            center = hotspot.center
            features.append({
                'type': 'Feature',
                'id': str(hotspot.id),
                'geometry': {
                    'type': 'Point',
                    'coordinates': [center.x, center.y],
                },
                'properties': {
                    'cell_id': hotspot.cell_id,
                    'contribution_count': hotspot.contribution_count,
                    'quality_score': hotspot.quality_score,
                    'density_level': hotspot.density_level,
                    'zone_name': hotspot.zone.name if hotspot.zone else None,
                    'last_calculated': hotspot.last_calculated.isoformat() if hotspot.last_calculated else None,
                },
            })

        return Response({
            'type': 'FeatureCollection',
            'features': features,
            'count': len(features),
        })


class OceanHotspotCreateView(generics.CreateAPIView):
    serializer_class = OceanHotspotCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = OceanHotspot.objects.all()


class OceanHotspotUpdateView(generics.UpdateAPIView):
    serializer_class = OceanHotspotCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = OceanHotspot.objects.all()


class OceanHotspotDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = OceanHotspot.objects.all()


class EmergencyContactListView(generics.ListAPIView):
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['contact_type', 'district', 'is_active']
    search_fields = ['name']
    queryset = EmergencyContact.objects.select_related('village', 'district').filter(is_active=True)


class EmergencyNearbyView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 50))

        if not lat or not lng:
            contacts = EmergencyContact.objects.filter(is_active=True)[:20]
        else:
            point = Point(float(lng), float(lat), srid=4326)
            contacts = EmergencyContact.objects.filter(
                is_active=True,
                location__distance_lte=(point, D(km=radius_km))
            ).distance(point).order_by('distance')[:20]

        serializer = EmergencyContactSerializer(contacts, many=True, context={'request': request})
        return Response(serializer.data)


class EmergencyContactCreateView(generics.CreateAPIView):
    serializer_class = EmergencyContactCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.all()


class EmergencyContactUpdateView(generics.UpdateAPIView):
    serializer_class = EmergencyContactCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.all()


class EmergencyContactDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.all()


class MapObservationsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius', 50))
        observation_type = request.query_params.get('type', 'all')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        quality_min = request.query_params.get('quality_min')
        species = request.query_params.get('species')
        village = request.query_params.get('village')
        zone = request.query_params.get('zone')
        limit = int(request.query_params.get('limit', 200))

        result = {}

        if observation_type in ('all', 'contributions'):
            from contributions.models import Contribution
            from accounts.models import Profile
            qs = Contribution.objects.filter(
                location__isnull=False,
                status__in=['verified', 'submitted', 'auto_validated'],
            )
            if date_from:
                qs = qs.filter(created_at__date__gte=date_from)
            if date_to:
                qs = qs.filter(created_at__date__lte=date_to)
            if quality_min:
                qs = qs.filter(quality_score__gte=float(quality_min))
            if village:
                qs = qs.filter(village__slug=village)
            if zone:
                qs = qs.filter(zone__slug=zone)
            if lat and lng:
                point = Point(float(lng), float(lat), srid=4326)
                qs = qs.filter(location__distance_lte=(point, D(km=radius_km)))

            contributions = []
            for c in qs.select_related('user', 'village')[:limit]:
                loc = c.location
                if loc:
                    contributions.append({
                        'id': str(c.id),
                        'latitude': loc.y,
                        'longitude': loc.x,
                        'type': c.type,
                        'status': c.status,
                        'quality_score': c.quality_score,
                        'created_at': c.created_at.isoformat(),
                        'user_name': c.user.username,
                        'village_name': c.village.name if c.village else None,
                    })
            result['contributions'] = contributions

        if observation_type in ('all', 'sightings'):
            from sightings.models import MarineSighting
            qs = MarineSighting.objects.filter(
                contribution__location__isnull=False,
                contribution__status__in=['verified', 'submitted', 'auto_validated'],
            )
            if date_from:
                qs = qs.filter(sighting_date__gte=date_from)
            if date_to:
                qs = qs.filter(sighting_date__lte=date_to)
            if species:
                qs = Q(species__slug=species) | Q(ai_species_suggestion__icontains=species)

            sightings = []
            for s in qs.select_related('species', 'contribution')[:limit]:
                loc = s.contribution.location
                if loc:
                    sightings.append({
                        'id': str(s.id),
                        'latitude': loc.y,
                        'longitude': loc.x,
                        'species_name': s.species.common_name if s.species else s.ai_species_suggestion,
                        'number_observed': s.number_observed,
                        'behavior': s.behavior,
                        'photo_url': s.photo.url if s.photo else None,
                        'sighting_date': str(s.sighting_date) if s.sighting_date else None,
                        'created_at': s.created_at.isoformat(),
                    })
            result['sightings'] = sightings

        if observation_type in ('all', 'sounds'):
            from ocean_sounds.models import OceanSound
            qs = OceanSound.objects.filter(
                contribution__location__isnull=False,
                contribution__status__in=['verified', 'submitted', 'auto_validated'],
            )
            if date_from:
                qs = qs.filter(recording_date__gte=date_from)
            if date_to:
                qs = qs.filter(recording_date__lte=date_to)

            sounds = []
            for s in qs.select_related('contribution')[:limit]:
                loc = s.contribution.location
                if loc:
                    sounds.append({
                        'id': str(s.id),
                        'latitude': loc.y,
                        'longitude': loc.x,
                        'instrument': s.instrument,
                        'duration_seconds': s.duration_seconds,
                        'recording_date': str(s.recording_date) if s.recording_date else None,
                        'created_at': s.created_at.isoformat(),
                    })
            result['sounds'] = sounds

        return Response(result)


# ---------------------------------------------------------------------------
# Contributor map — contribution counts per village / district / zone / state
# ---------------------------------------------------------------------------

CONTRIBUTOR_LEVELS = ('state', 'zone', 'district', 'village')
MAX_CONTRIBUTOR_ROWS = 20000
MAX_POINT_RESOLUTIONS = 2000


def _is_true(value):
    return str(value).lower() in ('1', 'true', 'yes', 'on')


def _parse_bbox(value):
    """Parse "minLng,minLat,maxLng,maxLat" into a 4326 Polygon (or None)."""
    if not value:
        return None
    try:
        parts = [float(x) for x in str(value).split(',')]
    except (TypeError, ValueError):
        return None
    if len(parts) != 4:
        return None
    minx, miny, maxx, maxy = parts
    if minx >= maxx or miny >= maxy:
        return None
    poly = Polygon.from_bbox((minx, miny, maxx, maxy))
    poly.srid = 4326
    return poly


def _base_public_contributions(request):
    """Public/verified contributions that carry a location — the map's dataset."""
    from contributions.models import Contribution

    qs = Contribution.objects.filter(location__isnull=False).filter(
        Q(status='verified')
        | Q(visibility_status__in=['COMMUNITY_VISIBLE', 'MARKETPLACE_VISIBLE'])
    )

    contrib_type = request.query_params.get('type')
    if contrib_type and contrib_type != 'all':
        qs = qs.filter(type=contrib_type)

    if _is_true(request.query_params.get('is_coastal')):
        qs = qs.filter(village__is_coastal=True)

    date_from = request.query_params.get('date_from')
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    date_to = request.query_params.get('date_to')
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    bbox = _parse_bbox(request.query_params.get('bbox'))
    if bbox is not None:
        qs = qs.filter(location__within=bbox)

    return qs, bbox


def _build_geo_context():
    """Preload location trees and derive state/zone/district centroids."""
    from locations.models import Village, District, Zone, StateFisheriesProfile

    villages = {}
    district_acc = {}
    for v in Village.objects.values(
        'id', 'name', 'slug', 'district_id', 'district__name', 'district__slug',
        'district__zone_id', 'district__zone__name', 'district__state',
        'latitude', 'longitude', 'center',
    ):
        if v['latitude'] is None and v['center'] is not None:
            v['latitude'] = v['center'].y
            v['longitude'] = v['center'].x
        villages[v['id']] = v
        if v['latitude'] is not None and v['longitude'] is not None and v['district_id']:
            acc = district_acc.setdefault(v['district_id'], [0.0, 0.0, 0])
            acc[0] += v['latitude']
            acc[1] += v['longitude']
            acc[2] += 1

    districts = {}
    for d in District.objects.values('id', 'name', 'slug', 'state', 'zone_id'):
        acc = district_acc.get(d['id'])
        d['latitude'] = round(acc[0] / acc[2], 5) if acc and acc[2] else None
        d['longitude'] = round(acc[1] / acc[2], 5) if acc and acc[2] else None
        districts[d['id']] = d

    zone_acc = {}
    for d in districts.values():
        if d['latitude'] is not None and d['zone_id']:
            acc = zone_acc.setdefault(d['zone_id'], [0.0, 0.0, 0])
            acc[0] += d['latitude']
            acc[1] += d['longitude']
            acc[2] += 1

    zones = {}
    for z in Zone.objects.values('id', 'name', 'slug'):
        acc = zone_acc.get(z['id'])
        z['latitude'] = round(acc[0] / acc[2], 5) if acc and acc[2] else None
        z['longitude'] = round(acc[1] / acc[2], 5) if acc and acc[2] else None
        zones[z['id']] = z

    states = {
        sp['state'].lower(): sp
        for sp in StateFisheriesProfile.objects.values('state', 'latitude', 'longitude')
    }
    # Fallback state centroid = mean of its district centroids.
    state_acc = {}
    for d in districts.values():
        if d['latitude'] is not None and d['state']:
            acc = state_acc.setdefault(d['state'].lower(), [d['state'], 0.0, 0.0, 0])
            acc[1] += d['latitude']
            acc[2] += d['longitude']
            acc[3] += 1
    for key, (label, lat_sum, lng_sum, count) in state_acc.items():
        if key not in states:
            states[key] = {
                'state': label,
                'latitude': round(lat_sum / count, 5),
                'longitude': round(lng_sum / count, 5),
            }

    return {'villages': villages, 'districts': districts, 'zones': zones, 'states': states}


def _resolve_point(loc, cache, ctx):
    """Best-effort assign a bare point to a village/district via PostGIS contains."""
    if loc is None:
        return None
    key = (round(loc.x, 4), round(loc.y, 4))
    if key in cache:
        return cache[key]

    from locations.models import Village, District

    result = None
    village = Village.objects.filter(boundary__contains=loc).select_related('district').first()
    if village:
        result = {
            'village_id': village.id,
            'district_id': village.district_id,
            'zone_id': village.district.zone_id,
            'state': village.district.state,
        }
    else:
        district = District.objects.filter(boundary__contains=loc).first()
        if district:
            result = {
                'village_id': None,
                'district_id': district.id,
                'zone_id': district.zone_id,
                'state': district.state,
            }
    cache[key] = result
    return result


class ContributorAggregateView(APIView):
    """
    GET /maps/contributors/?level=state|zone|district|village&parent=...

    Aggregates public/verified contributions by area for the contributor map.
    Counts only — exact coordinates are never exposed here.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        level = request.query_params.get('level', 'state')
        if level not in CONTRIBUTOR_LEVELS:
            level = 'state'
        parent = (request.query_params.get('parent') or '').strip() or None

        qs, _bbox = _base_public_contributions(request)
        rows = list(qs.values(
            'location', 'village_id', 'zone_id', 'user_id', 'points', 'status',
        )[:MAX_CONTRIBUTOR_ROWS])
        truncated = len(rows) >= MAX_CONTRIBUTOR_ROWS

        ctx = _build_geo_context()
        villages, districts, zones, states = (
            ctx['villages'], ctx['districts'], ctx['zones'], ctx['states'],
        )

        resolve = _is_true(request.query_params.get('resolve', '1'))
        resolve_cache = {}
        resolved = 0
        parent_key = parent.lower() if parent else None

        groups = {}

        for row in rows:
            vid = row['village_id']
            zid = row['zone_id']
            did = None
            state = None

            if vid and vid in villages:
                v = villages[vid]
                did = v['district_id']
                zid = v['district__zone_id']
                state = v['district__state']
            elif resolve and resolved < MAX_POINT_RESOLUTIONS:
                res = _resolve_point(row['location'], resolve_cache, ctx)
                resolved += 1
                if res:
                    vid = res['village_id']
                    did = res['district_id']
                    zid = res['zone_id']
                    state = res['state']

            if parent_key:
                if level == 'zone' and (state or '').lower() != parent_key:
                    continue
                if level == 'district' and (zones.get(zid, {}) or {}).get('slug') != parent_key:
                    continue
                if level == 'village' and (districts.get(did, {}) or {}).get('slug') != parent_key:
                    continue

            if level == 'state':
                key = state or 'Unassigned'
                sp = states.get((state or '').lower())
                entry = {
                    'id': (state or '').lower() or None,
                    'name': state or 'Unassigned',
                    'slug': (state or '').lower().replace(' ', '-') or None,
                    'latitude': sp['latitude'] if sp else None,
                    'longitude': sp['longitude'] if sp else None,
                }
            elif level == 'zone':
                z = zones.get(zid)
                key = zid or 'Unassigned'
                entry = {
                    'id': str(zid) if zid else None,
                    'name': z['name'] if z else 'Unassigned',
                    'slug': z['slug'] if z else None,
                    'latitude': z['latitude'] if z else None,
                    'longitude': z['longitude'] if z else None,
                }
            elif level == 'district':
                d = districts.get(did)
                key = did or 'Unassigned'
                entry = {
                    'id': str(did) if did else None,
                    'name': d['name'] if d else 'Unassigned',
                    'slug': d['slug'] if d else None,
                    'latitude': d['latitude'] if d else None,
                    'longitude': d['longitude'] if d else None,
                }
            else:  # village
                v = villages.get(vid)
                key = vid or 'Unassigned'
                entry = {
                    'id': str(vid) if vid else None,
                    'name': v['name'] if v else 'Unassigned',
                    'slug': v['slug'] if v else None,
                    'latitude': v['latitude'] if v else None,
                    'longitude': v['longitude'] if v else None,
                }

            group = groups.setdefault(key, {
                **entry,
                'level': level,
                'contributions': 0,
                'verified': 0,
                'points': 0,
                'contributors': set(),
            })
            group['contributions'] += 1
            if row['status'] == 'verified':
                group['verified'] += 1
            group['points'] += row['points'] or 0
            group['contributors'].add(row['user_id'])

        result_rows = []
        totals = {'contributions': 0, 'verified': 0, 'points': 0, 'contributors': set()}
        for group in groups.values():
            totals['contributions'] += group['contributions']
            totals['verified'] += group['verified']
            totals['points'] += group['points']
            totals['contributors'] |= group['contributors']
            group['contributors'] = len(group['contributors'])
            result_rows.append(group)

        result_rows.sort(key=lambda r: (-r['contributions'], -r['points'], r['name'] or ''))
        totals['contributors'] = len(totals['contributors'])

        return Response({
            'level': level,
            'parent': parent,
            'totals': totals,
            'rows': result_rows,
            'truncated': truncated,
        })


class ContributorPeopleView(APIView):
    """
    GET /maps/contributors/people/?bbox=minLng,minLat,maxLng,maxLat

    Opted-in contributors (Profile.appear_on_map) with their village-level
    location and verified-contribution score. No exact contribution points.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from accounts.models import Profile
        from contributions.models import Contribution
        from recognition.models import ContributionScore

        bbox = _parse_bbox(request.query_params.get('bbox'))
        bounds = bbox.extent if bbox is not None else None

        profiles = list(
            Profile.objects
            .filter(appear_on_map=True, latitude__isnull=False, longitude__isnull=False)
            .select_related('user', 'village', 'village__district', 'village__district__zone')
        )

        limit = int(request.query_params.get('limit', 1000))
        user_ids = [p.user_id for p in profiles]

        scores = {
            cs.user_id: cs
            for cs in ContributionScore.objects.filter(user_id__in=user_ids)
        }

        # Fall back to the contributor's latest contribution village when the
        # profile itself has no village set.
        village_by_user = {}
        for row in (
            Contribution.objects
            .filter(user_id__in=user_ids, village__isnull=False)
            .order_by('user_id', '-created_at')
            .values(
                'user_id', 'village__name', 'village__district__name',
                'village__district__state',
            )
        ):
            village_by_user.setdefault(row['user_id'], row)

        rows = []
        for p in profiles:
            if bounds:
                minx, miny, maxx, maxy = bounds
                if not (minx <= p.longitude <= maxx and miny <= p.latitude <= maxy):
                    continue
            cs = scores.get(p.user_id)
            village = p.village
            district = village.district if village else None
            fallback = village_by_user.get(p.user_id, {})

            if p.show_village:
                village_name = village.name if village else fallback.get('village__name')
                district_name = (
                    district.name if district
                    else fallback.get('village__district__name')
                )
                state_name = (
                    district.state if district
                    else fallback.get('village__district__state')
                )
            else:
                village_name = district_name = state_name = None

            rows.append({
                'user': str(p.user_id),
                'name': f"{p.user.first_name} {p.user.last_name}".strip() or p.user.username,
                'contributor_type': p.contributor_type,
                'village': village_name,
                'district': district_name,
                'state': state_name,
                'latitude': p.latitude,
                'longitude': p.longitude,
                'verified_contributions': cs.verified_contributions if cs else 0,
                'total_score': cs.total_score if cs else 0,
                'tier': cs.tier if cs else 'new',
                'earnings_inr': (cs.earnings_inr if cs else 0) if p.show_earnings else None,
                'earnings_hidden': not p.show_earnings,
                'can_connect': p.allow_connection_requests,
            })
            if len(rows) >= limit:
                break

        return Response({'count': len(rows), 'results': rows})


class ContributorPointsView(APIView):
    """
    GET /maps/contributors/points/?bbox=...&type=...

    Exact contribution points — only for contributions whose author opted in
    to the public contributor map (Profile.appear_on_map).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from contributions.models import Contribution

        qs = (
            Contribution.objects
            .filter(
                location__isnull=False,
                user__profile__appear_on_map=True,
            )
            .filter(
                Q(status='verified')
                | Q(visibility_status__in=['COMMUNITY_VISIBLE', 'MARKETPLACE_VISIBLE'])
            )
            .select_related('village', 'village__district', 'user')
        )

        contrib_type = request.query_params.get('type')
        if contrib_type and contrib_type != 'all':
            qs = qs.filter(type=contrib_type)

        bbox = _parse_bbox(request.query_params.get('bbox'))
        if bbox is not None:
            qs = qs.filter(location__within=bbox)

        limit = int(request.query_params.get('limit', 500))

        points = []
        for c in qs[:limit]:
            loc = c.location
            if not loc:
                continue
            village = c.village
            district = village.district if village else None
            points.append({
                'id': str(c.id),
                'latitude': loc.y,
                'longitude': loc.x,
                'type': c.type,
                'type_display': c.get_type_display(),
                'status': c.status,
                'points': c.points,
                'created_at': c.created_at.isoformat(),
                'contributor': c.author or c.user.username,
                'contributor_type': c.contributor_type,
                'village': village.name if village else None,
                'district': district.name if district else None,
                'state': district.state if district else None,
            })

        return Response({'count': len(points), 'results': points})

"""Tests for the contributor/contribution aggregation map endpoints."""

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import Profile, User
from contributions.models import Contribution
from locations.models import District, Village, Zone


def square(lng, lat, size=0.5):
    """A square MultiPolygon (4326) centred on lng/lat."""
    poly = Polygon.from_bbox((lng - size, lat - size, lng + size, lat + size))
    poly.srid = 4326
    return MultiPolygon(poly, srid=4326)


class ContributorMapTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.zone = Zone.objects.create(
            name='Zone 1', slug='zone-1', zone_number=1, boundary=square(80, 12, 3),
        )
        self.district = District.objects.create(
            name='Chennai', slug='chennai', zone=self.zone,
            boundary=square(80.2, 13, 0.8), state='Tamil Nadu',
        )
        self.village = Village.objects.create(
            name='Kovalam', slug='kovalam', district=self.district,
            boundary=square(80.25, 12.79, 0.05),
            latitude=12.79, longitude=80.25, is_coastal=True,
        )

        self.fisher = User.objects.create_user(username='fisher1', password='pass')
        self.profile = Profile.objects.create(
            user=self.fisher, contributor_type='fisher',
            village=self.village,
            appear_on_map=True, latitude=12.79, longitude=80.25,
        )
        self.other = User.objects.create_user(username='other', password='pass')
        Profile.objects.create(user=self.other, appear_on_map=False)

        self.agg_url = reverse('contributor_aggregates')
        self.people_url = reverse('contributor_people')
        self.points_url = reverse('contributor_points')

    def _contribution(self, user, status='verified', visibility='PRIVATE',
                      with_location=True, with_village=True, points=10):
        return Contribution.objects.create(
            user=user,
            type='observation',
            status=status,
            visibility_status=visibility,
            points=points,
            village=self.village if with_village else None,
            location=Point(80.25, 12.79, srid=4326) if with_location else None,
        )

    def test_village_aggregation_counts_public_and_verified(self):
        self._contribution(self.fisher, status='verified')
        self._contribution(self.fisher, status='verified', points=20)
        # submitted but community visible counts too
        self._contribution(self.other, status='submitted', visibility='COMMUNITY_VISIBLE')
        # private draft is excluded
        self._contribution(self.other, status='draft', visibility='PRIVATE')

        resp = self.client.get(self.agg_url, {'level': 'village'})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['level'], 'village')
        self.assertEqual(data['totals']['contributions'], 3)
        self.assertEqual(data['totals']['verified'], 2)
        self.assertEqual(data['totals']['contributors'], 2)

        row = next(r for r in data['rows'] if r['name'] == 'Kovalam')
        self.assertEqual(row['contributions'], 3)
        self.assertEqual(row['verified'], 2)
        self.assertEqual(row['points'], 40)
        self.assertEqual(row['contributors'], 2)
        self.assertEqual(row['latitude'], 12.79)

    def test_state_and_zone_levels(self):
        self._contribution(self.fisher, status='verified')

        state = self.client.get(self.agg_url, {'level': 'state'}).json()
        self.assertEqual(state['rows'][0]['name'], 'Tamil Nadu')

        zone = self.client.get(self.agg_url, {'level': 'zone'}).json()
        self.assertEqual(zone['rows'][0]['name'], 'Zone 1')

        district = self.client.get(self.agg_url, {'level': 'district'}).json()
        self.assertEqual(district['rows'][0]['name'], 'Chennai')
        self.assertEqual(district['rows'][0]['latitude'], 12.79)

    def test_parent_drilldown_filters_rows(self):
        self._contribution(self.fisher, status='verified')

        by_state = self.client.get(
            self.agg_url, {'level': 'zone', 'parent': 'Tamil Nadu'},
        ).json()
        self.assertEqual(len(by_state['rows']), 1)

        empty = self.client.get(
            self.agg_url, {'level': 'zone', 'parent': 'Kerala'},
        ).json()
        self.assertEqual(empty['rows'], [])

        by_zone = self.client.get(
            self.agg_url, {'level': 'district', 'parent': 'zone-1'},
        ).json()
        self.assertEqual(by_zone['rows'][0]['name'], 'Chennai')

        by_district = self.client.get(
            self.agg_url, {'level': 'village', 'parent': 'chennai'},
        ).json()
        self.assertEqual(by_district['rows'][0]['name'], 'Kovalam')

    def test_bbox_limits_scope(self):
        self._contribution(self.fisher, status='verified')

        inside = self.client.get(
            self.agg_url, {'level': 'village', 'bbox': '80.0,12.5,80.5,13.0'},
        ).json()
        self.assertEqual(inside['totals']['contributions'], 1)

        outside = self.client.get(
            self.agg_url, {'level': 'village', 'bbox': '70.0,8.0,71.0,9.0'},
        ).json()
        self.assertEqual(outside['totals']['contributions'], 0)

    def test_unassigned_point_is_resolved_by_boundary(self):
        self._contribution(self.fisher, status='verified', with_village=False)

        resp = self.client.get(self.agg_url, {'level': 'village'}).json()
        row = next(r for r in resp['rows'] if r['name'] == 'Kovalam')
        self.assertEqual(row['contributions'], 1)

        # resolve=0 leaves it unassigned
        raw = self.client.get(
            self.agg_url, {'level': 'village', 'resolve': '0'},
        ).json()
        self.assertIn('Unassigned', [r['name'] for r in raw['rows']])

    def test_people_endpoint_respects_opt_in(self):
        resp = self.client.get(self.people_url).json()
        self.assertEqual(resp['count'], 1)
        person = resp['results'][0]
        self.assertEqual(person['name'], 'fisher1')
        self.assertEqual(person['village'], 'Kovalam')
        self.assertEqual(person['district'], 'Chennai')
        self.assertEqual(person['state'], 'Tamil Nadu')

    def test_points_endpoint_only_returns_opted_in_authors(self):
        self._contribution(self.fisher, status='verified')
        self._contribution(self.other, status='verified')

        resp = self.client.get(self.points_url).json()
        self.assertEqual(resp['count'], 1)
        self.assertEqual(resp['results'][0]['contributor'], 'fisher1')
        self.assertEqual(resp['results'][0]['village'], 'Kovalam')

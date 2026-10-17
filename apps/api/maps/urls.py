from django.urls import path
from . import views

urlpatterns = [
    path('hotspots/', views.OceanHotspotListView.as_view(), name='ocean_hotspot_list'),
    path('hotspots/geojson/', views.OceanHotspotGeoJSONView.as_view(), name='ocean_hotspot_geojson'),
    path('hotspots/create/', views.OceanHotspotCreateView.as_view(), name='hotspot_create'),
    path('hotspots/<uuid:pk>/update/', views.OceanHotspotUpdateView.as_view(), name='hotspot_update'),
    path('hotspots/<uuid:pk>/delete/', views.OceanHotspotDeleteView.as_view(), name='hotspot_delete'),
    path('observations/', views.MapObservationsView.as_view(), name='map_observations'),
    path('contributors/', views.ContributorAggregateView.as_view(), name='contributor_aggregates'),
    path('contributors/people/', views.ContributorPeopleView.as_view(), name='contributor_people'),
    path('contributors/points/', views.ContributorPointsView.as_view(), name='contributor_points'),
    path('emergency/contacts/', views.EmergencyContactListView.as_view(), name='emergency_contact_list'),
    path('emergency/contacts/create/', views.EmergencyContactCreateView.as_view(), name='emergency_contact_create'),
    path('emergency/contacts/<uuid:pk>/update/', views.EmergencyContactUpdateView.as_view(), name='emergency_contact_update'),
    path('emergency/contacts/<uuid:pk>/delete/', views.EmergencyContactDeleteView.as_view(), name='emergency_contact_delete'),
    path('emergency/nearby/', views.EmergencyNearbyView.as_view(), name='emergency_nearby'),
]

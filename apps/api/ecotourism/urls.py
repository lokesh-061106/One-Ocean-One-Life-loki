from django.urls import path
from . import views

urlpatterns = [
    # 5-model taxonomy
    path('models/', views.ExperienceModelListView.as_view(), name='ecotourism_models'),

    # Experiences (5-model listings) — legacy 'opportunities/' aliases kept
    path('experiences/', views.ExperienceListView.as_view(), name='experience_list'),
    path('experiences/create/', views.ExperienceCreateView.as_view(), name='experience_create'),
    path('experiences/<str:pk>/', views.ExperienceDetailView.as_view(), name='experience_detail'),
    path('experiences/<uuid:pk>/update/', views.ExperienceUpdateView.as_view(), name='experience_update'),
    path('experiences/<uuid:pk>/delete/', views.ExperienceDeleteView.as_view(), name='experience_delete'),
    path('opportunities/', views.ExperienceListView.as_view(), name='tourism_opportunity_list'),
    path('opportunities/create/', views.ExperienceCreateView.as_view(), name='tourism_opportunity_create'),
    path('opportunities/<str:pk>/', views.ExperienceDetailView.as_view(), name='tourism_opportunity_detail'),
    path('opportunities/<uuid:pk>/update/', views.ExperienceUpdateView.as_view(), name='tourism_opportunity_update'),
    path('opportunities/<uuid:pk>/delete/', views.ExperienceDeleteView.as_view(), name='tourism_opportunity_delete'),

    # Packages
    path('packages/', views.ExperiencePackageListView.as_view(), name='package_list'),
    path('packages/create/', views.ExperiencePackageCreateView.as_view(), name='package_create'),
    path('packages/<uuid:pk>/', views.ExperiencePackageDetailView.as_view(), name='package_detail'),
    path('packages/<uuid:pk>/update/', views.ExperiencePackageUpdateView.as_view(), name='package_update'),
    path('packages/<uuid:pk>/delete/', views.ExperiencePackageDeleteView.as_view(), name='package_delete'),

    # Fisher families
    path('families/', views.FisherFamilyListView.as_view(), name='family_list'),
    path('families/create/', views.FisherFamilyCreateView.as_view(), name='family_create'),
    path('families/<uuid:pk>/', views.FisherFamilyDetailView.as_view(), name='family_detail'),
    path('families/<uuid:pk>/update/', views.FisherFamilyUpdateView.as_view(), name='family_update'),

    # Bookings + payments + transparent ledger
    path('bookings/', views.BookingListCreateView.as_view(), name='booking_list_create'),
    path('bookings/<uuid:pk>/', views.BookingDetailView.as_view(), name='booking_detail'),
    path('bookings/<uuid:pk>/pay/', views.BookingPayView.as_view(), name='booking_pay'),
    path('bookings/<uuid:pk>/verify/', views.BookingVerifyView.as_view(), name='booking_verify'),
    path('bookings/<uuid:pk>/cancel/', views.BookingCancelView.as_view(), name='booking_cancel'),
    path('bookings/<uuid:pk>/ledger/', views.BookingLedgerView.as_view(), name='booking_ledger'),
    path('my-bookings/', views.MyBookingsView.as_view(), name='my_bookings'),

    # Revenue split (transparency)
    path('split-rules/', views.SplitRuleListView.as_view(), name='split_rules'),
    path('split-preview/', views.SplitPreviewView.as_view(), name='split_preview'),

    # Reviews
    path('reviews/', views.ReviewListCreateView.as_view(), name='review_list_create'),

    # Lean season / fishing ban
    path('lean-season/', views.LeanSeasonView.as_view(), name='lean_season'),

    # Map & Location Calibration
    path('map-points/', views.MapPointsView.as_view(), name='map_points'),
    path('calibrate-locations/', views.CalibrateLocationsView.as_view(), name='calibrate_locations'),

    # Provider console
    path('provider/dashboard/', views.ProviderDashboardView.as_view(), name='provider_dashboard'),
    path('provider/bookings/<uuid:pk>/action/', views.ProviderBookingActionView.as_view(), name='provider_booking_action'),

    # Beaches
    path('beaches/', views.BeachProfileListView.as_view(), name='beach_profile_list'),
    path('beaches/create/', views.BeachProfileCreateView.as_view(), name='beach_profile_create'),
    path('beaches/<uuid:pk>/', views.BeachProfileDetailView.as_view(), name='beach_profile_detail'),
    path('beaches/<uuid:pk>/update/', views.BeachProfileUpdateView.as_view(), name='beach_profile_update'),
    path('beaches/<uuid:pk>/delete/', views.BeachProfileDeleteView.as_view(), name='beach_profile_delete'),

    # Cleanups
    path('cleanups/', views.BeachCleanupEventListView.as_view(), name='beach_cleanup_list'),
    # create/ must precede <str:pk>/ or the slug matcher would swallow it.
    path('cleanups/create/', views.BeachCleanupEventCreateView.as_view(), name='beach_cleanup_create'),
    path('cleanups/<str:pk>/', views.BeachCleanupEventDetailView.as_view(), name='beach_cleanup_detail'),
    path('cleanups/<str:pk>/photos/', views.BeachCleanupPhotoUploadView.as_view(), name='beach_cleanup_photo_upload'),
    path('cleanups/photos/<uuid:pk>/', views.BeachCleanupPhotoDeleteView.as_view(), name='beach_cleanup_photo_delete'),

    # Local businesses
    path('businesses/', views.LocalBusinessListView.as_view(), name='local_business_list'),
    path('businesses/create/', views.LocalBusinessCreateView.as_view(), name='local_business_create'),
    path('businesses/<uuid:pk>/', views.LocalBusinessDetailView.as_view(), name='local_business_detail'),
    path('businesses/<uuid:pk>/update/', views.LocalBusinessUpdateView.as_view(), name='local_business_update'),
    path('businesses/<uuid:pk>/delete/', views.LocalBusinessDeleteView.as_view(), name='local_business_delete'),
]

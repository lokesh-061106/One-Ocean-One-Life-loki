import os
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.db.models import Avg, Count, Min, Q, Sum
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import (
    BeachCleanupEvent,
    BeachCleanupPhoto,
    BeachProfile,
    Booking,
    ExperiencePackage,
    FisherFamily,
    LocalBusiness,
    MODEL_CATEGORY_CHOICES,
    Review,
    SplitRule,
    TourismOpportunity,
)
from .serializers import (
    BeachCleanupEventCreateSerializer,
    BeachCleanupEventSerializer,
    BeachCleanupPhotoSerializer,
    BeachProfileCreateUpdateSerializer,
    BeachProfileDetailSerializer,
    BeachProfileListSerializer,
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingListSerializer,
    ExperienceCreateUpdateSerializer,
    ExperienceDetailSerializer,
    ExperienceListSerializer,
    ExperiencePackageCreateUpdateSerializer,
    ExperiencePackageDetailSerializer,
    ExperiencePackageListSerializer,
    FisherFamilyCreateUpdateSerializer,
    FisherFamilyDetailSerializer,
    FisherFamilyListSerializer,
    LocalBusinessCreateUpdateSerializer,
    LocalBusinessDetailSerializer,
    LocalBusinessListSerializer,
    ReviewSerializer,
    SplitLineSerializer,
    SplitRuleSerializer,
    _can_manage_cleanup,
)

STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']
PROVIDER_ROLES = ['TOURISM_PROVIDER', 'FISHERMAN', 'VENDOR', 'ADMIN', 'SUPER_ADMIN']


def _is_provider(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.role in PROVIDER_ROLES or user.is_staff)
    )


def _is_editor(user, obj) -> bool:
    """Owner of the listing, or staff."""
    if not user or not user.is_authenticated:
        return False
    if user.role in STAFF_ROLES or user.is_staff:
        return True
    owner = getattr(obj, 'provider_id', None) or getattr(obj, 'owner_id', None) or getattr(obj, 'organized_by_id', None)
    return owner == user.id


class IsProvider(permissions.BasePermission):
    def has_permission(self, request, view):
        return _is_provider(request.user)


# --------------------------------------------------------------------------- #
# Beaches (legacy CRUD, ownership-scoped writes)
# --------------------------------------------------------------------------- #

class BeachProfileListView(generics.ListAPIView):
    serializer_class = BeachProfileListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['district', 'cleanliness', 'safety', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['average_rating', 'total_reviews', 'name']
    queryset = BeachProfile.objects.select_related('village', 'district').filter(is_active=True)


class BeachProfileDetailView(generics.RetrieveAPIView):
    serializer_class = BeachProfileDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = BeachProfile.objects.select_related('village', 'district').all()


class BeachProfileCreateView(generics.CreateAPIView):
    serializer_class = BeachProfileCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]
    queryset = BeachProfile.objects.all()


class BeachProfileUpdateView(generics.UpdateAPIView):
    serializer_class = BeachProfileCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return BeachProfile.objects.all()
        return BeachProfile.objects.none()


class BeachProfileDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return BeachProfile.objects.all()
        return BeachProfile.objects.none()


# --------------------------------------------------------------------------- #
# Experiences (the 5-model listings)
# --------------------------------------------------------------------------- #

class ExperienceListView(generics.ListAPIView):
    serializer_class = ExperienceListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = [
        'model_category', 'opportunity_type', 'village', 'beach', 'family',
        'is_sustainable', 'is_offshore', 'lean_season_friendly', 'is_active',
    ]
    search_fields = ['name', 'description', 'meeting_point']
    ordering_fields = ['rating', 'price_min', 'created_at', 'total_bookings', 'duration_minutes']
    queryset = TourismOpportunity.objects.select_related(
        'village', 'beach', 'family', 'provider'
    ).filter(is_active=True)

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('price_min_gte'):
            try:
                qs = qs.filter(price_min__gte=Decimal(params['price_min_gte']))
            except Exception:
                pass
        if params.get('price_max_lte'):
            try:
                qs = qs.filter(price_min__lte=Decimal(params['price_max_lte']))
            except Exception:
                pass
        if params.get('district'):
            qs = qs.filter(village__district__name__iexact=params['district'])
        if params.get('state'):
            qs = qs.filter(village__district__state__iexact=params['state'])
        if params.get('lean_season') in ('1', 'true', 'True'):
            qs = qs.filter(lean_season_friendly=True)
            candidate_ids = list(qs.values_list('id', flat=True))
            blocked = [
                e.id
                for e in TourismOpportunity.objects.filter(id__in=candidate_ids)
                .select_related('village__district')
                if services.is_offshore_blocked(e)
            ]
            qs = qs.exclude(id__in=blocked)
        return qs


class ExperienceDetailView(generics.RetrieveAPIView):
    serializer_class = ExperienceDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = TourismOpportunity.objects.select_related(
        'village', 'village__district', 'beach', 'family', 'provider'
    ).all()

    def get_object(self):
        """Resolve the lookup value as either a slug or the raw UUID id."""
        import uuid as uuid_mod

        lookup = self.kwargs.get(self.lookup_field or 'pk')
        qs = self.filter_queryset(self.get_queryset())
        obj = qs.filter(slug=lookup).first()
        if obj is not None:
            return obj
        try:
            pk = uuid_mod.UUID(str(lookup))
        except (ValueError, TypeError, AttributeError):
            raise Http404(f'No TourismOpportunity found matching {lookup!r}')
        try:
            return qs.get(pk=pk)
        except (TourismOpportunity.DoesNotExist, DjangoValidationError, ValueError, TypeError):
            raise Http404(f'No TourismOpportunity found matching {lookup!r}')


class ExperienceCreateView(generics.CreateAPIView):
    serializer_class = ExperienceCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class ExperienceUpdateView(generics.UpdateAPIView):
    serializer_class = ExperienceCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return TourismOpportunity.objects.all()
        return TourismOpportunity.objects.filter(provider=user)


class ExperienceDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return TourismOpportunity.objects.all()
        return TourismOpportunity.objects.filter(provider=user)


class ExperienceModelListView(APIView):
    """The 5 O3L ecotourism models with live counts and starting prices."""

    permission_classes = [permissions.AllowAny]

    BLURBS = {
        'fisher_coastal': 'Book a fisher as your guide — boats, nets, fish ID, sea stories and sunrise/sunset trips.',
        'nature_tours': 'Mangrove kayaking, lagoon and estuary tours, birding, turtle & dolphin observation.',
        'homestay_food': 'Stay with a fishing family — home rooms, seafood meals, cooking and craft experiences.',
        'ocean_learning': 'Marine-life programs, underwater sounds, citizen science and school field visits.',
        'festival_market': 'Weekend village festivals — demos, food stalls, crafts, music and beach clean-ups.',
    }
    ICONS = {
        'fisher_coastal': '🎣',
        'nature_tours': '🌿',
        'homestay_food': '🏠',
        'ocean_learning': '🎧',
        'festival_market': '🎉',
    }

    def get(self, request):
        rows = (
            TourismOpportunity.objects.filter(is_active=True)
            .values('model_category')
            .annotate(count=Count('id'), min_price=Min('price_min'))
        )
        by_cat = {r['model_category']: r for r in rows}
        pkg_rows = (
            ExperiencePackage.objects.filter(is_active=True)
            .values('model_category')
            .annotate(count=Count('id'))
        )
        pkg_by_cat = {r['model_category']: r['count'] for r in pkg_rows}

        data = []
        for key, label in MODEL_CATEGORY_CHOICES:
            row = by_cat.get(key, {})
            data.append({
                'key': key,
                'label': label,
                'blurb': self.BLURBS.get(key, ''),
                'icon': self.ICONS.get(key, '🌊'),
                'experience_count': row.get('count', 0),
                'package_count': pkg_by_cat.get(key, 0),
                'min_price': row.get('min_price'),
            })
        return Response(data)


# --------------------------------------------------------------------------- #
# Packages
# --------------------------------------------------------------------------- #

class ExperiencePackageListView(generics.ListAPIView):
    serializer_class = ExperiencePackageListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['model_category', 'village', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'rating', 'created_at', 'total_bookings']
    queryset = ExperiencePackage.objects.select_related('village').prefetch_related('families').filter(is_active=True)


class ExperiencePackageDetailView(generics.RetrieveAPIView):
    serializer_class = ExperiencePackageDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ExperiencePackage.objects.select_related('village', 'provider').prefetch_related('families').all()


class ExperiencePackageCreateView(generics.CreateAPIView):
    serializer_class = ExperiencePackageCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class ExperiencePackageUpdateView(generics.UpdateAPIView):
    serializer_class = ExperiencePackageCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return ExperiencePackage.objects.all()
        return ExperiencePackage.objects.filter(provider=user)


class ExperiencePackageDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return ExperiencePackage.objects.all()
        return ExperiencePackage.objects.filter(provider=user)


# --------------------------------------------------------------------------- #
# Fisher families
# --------------------------------------------------------------------------- #

class FisherFamilyListView(generics.ListAPIView):
    serializer_class = FisherFamilyListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['village', 'is_verified', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['rating', 'total_earnings', 'name']
    queryset = FisherFamily.objects.select_related('village', 'village__district').filter(is_active=True)


class FisherFamilyDetailView(generics.RetrieveAPIView):
    serializer_class = FisherFamilyDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = FisherFamily.objects.select_related('village', 'village__district').all()


class FisherFamilyCreateView(generics.CreateAPIView):
    serializer_class = FisherFamilyCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class FisherFamilyUpdateView(generics.UpdateAPIView):
    serializer_class = FisherFamilyCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return FisherFamily.objects.all()
        return FisherFamily.objects.filter(owner=user)


# --------------------------------------------------------------------------- #
# Split rules (public transparency)
# --------------------------------------------------------------------------- #

class SplitRuleListView(generics.ListAPIView):
    serializer_class = SplitRuleSerializer
    permission_classes = [permissions.AllowAny]
    queryset = SplitRule.objects.filter(is_active=True)


class SplitPreviewView(APIView):
    """POST {amount, scope} -> the 4 ledger lines (calculator for the UI)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
        except Exception:
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'error': 'Amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)
        scope = request.data.get('scope', 'default')
        lines = services.compute_split(amount, scope)
        return Response({'amount': amount, 'scope': scope, 'lines': SplitLineSerializer(lines, many=True).data})


# --------------------------------------------------------------------------- #
# Bookings
# --------------------------------------------------------------------------- #

class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return BookingListSerializer if self.request.method == 'GET' else BookingCreateSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related('experience', 'package', 'family')
        if user.role in STAFF_ROLES or user.is_staff:
            return qs
        return qs.filter(Q(customer=user) | Q(provider=user))

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data['experience_date'] < timezone.localdate():
            raise ValidationError({'experience_date': 'Date cannot be in the past.'})

        experience = None
        package = None
        family = None
        provider = None
        scope = 'default'

        if data.get('experience'):
            try:
                experience = TourismOpportunity.objects.select_related(
                    'village', 'village__district', 'family'
                ).get(pk=data['experience'], is_active=True)
            except TourismOpportunity.DoesNotExist:
                raise ValidationError({'experience': 'Experience not found.'})
            family = experience.family
            provider = experience.provider
            scope = experience.model_category

            if experience.max_participants and data['participants'] > experience.max_participants:
                raise ValidationError({
                    'participants': f'Max {experience.max_participants} participants allowed.'
                })
            blocked = services.is_offshore_blocked(experience, on_date=data['experience_date'])
            if blocked:
                raise ValidationError({
                    'experience_date': (
                        'This offshore experience is paused during the active '
                        'fishing-ban window. Please pick a shore-based alternative '
                        'from the Lean Season opportunities.'
                    )
                })
            unit_price = experience.booking_price
            price_unit = experience.price_unit
        else:
            try:
                package = ExperiencePackage.objects.select_related('village').get(
                    pk=data['package'], is_active=True
                )
            except ExperiencePackage.DoesNotExist:
                raise ValidationError({'package': 'Package not found.'})
            if data['participants'] > package.max_participants:
                raise ValidationError({
                    'participants': f'Max {package.max_participants} participants allowed.'
                })
            unit_price = package.price
            price_unit = 'group'

        total = services.compute_booking_total(unit_price, data['participants'], price_unit)
        if total <= 0:
            raise ValidationError({'experience': 'This listing has no price set yet.'})

        lean_active = bool(
            services.active_lean_windows(
                state=experience.village.district.state if experience and experience.village and experience.village.district_id else None,
                on_date=data['experience_date'],
            )
        )

        booking = Booking.objects.create(
            booking_ref=services.generate_booking_ref(),
            customer=request.user,
            experience=experience,
            package=package,
            family=family,
            provider=provider or (package.provider if package else None),
            experience_date=data['experience_date'],
            time_slot=data.get('time_slot', ''),
            participants=data['participants'],
            special_requests=data.get('special_requests', ''),
            contact_name=data.get('contact_name') or request.user.get_full_name(),
            contact_phone=data.get('contact_phone') or getattr(request.user, 'phone', '') or '',
            contact_email=data.get('contact_email') or request.user.email or '',
            unit_price=unit_price,
            total_amount=total,
            status='pending',
            payment_status='unpaid',
            is_lean_season=lean_active,
        )

        split_lines = services.compute_split(total, scope)
        out = BookingDetailSerializer(booking).data
        out['split_preview'] = split_lines
        return Response(out, status=status.HTTP_201_CREATED)


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related('experience', 'package', 'family', 'customer')
        if user.role in STAFF_ROLES or user.is_staff:
            return qs
        return qs.filter(Q(customer=user) | Q(provider=user))


class BookingPayView(APIView):
    """Create a gateway order for a booking (live Razorpay or demo fallback)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, customer=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.payment_status == 'paid':
            return Response({'error': 'Booking is already paid.'}, status=status.HTTP_400_BAD_REQUEST)
        if booking.status in ('cancelled', 'refunded'):
            return Response({'error': 'Booking is not payable.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = services.create_gateway_order(booking)
        key_id = os.environ.get('RAZORPAY_KEY_ID', '')
        payload['key_id'] = key_id if payload['mode'] == 'live' else ''
        return Response(payload)


class BookingVerifyView(APIView):
    """Verify payment and materialize the transparent payout ledger."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, customer=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment_id = request.data.get('razorpay_payment_id') or request.data.get('payment_id', '')
        order_id = request.data.get('razorpay_order_id') or request.data.get('order_id', '')
        signature = request.data.get('razorpay_signature') or request.data.get('signature', '')

        if not payment_id or not order_id:
            return Response({'error': 'payment_id and order_id are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        ok, err = services.verify_and_capture(booking, payment_id, order_id, signature)
        if not ok:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        booking.refresh_from_db()
        return Response({
            'status': 'success',
            'booking': BookingDetailSerializer(booking).data,
        })


class BookingCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, customer=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status in ('cancelled', 'refunded', 'completed'):
            return Response({'error': f'Cannot cancel a {booking.status} booking.'},
                            status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'cancelled'
        booking.cancel_reason = str(request.data.get('reason', ''))[:255]
        if booking.payment_status == 'paid':
            booking.payment_status = 'refunded'
            booking.payouts.update(status='reversed')
        booking.save(update_fields=['status', 'cancel_reason', 'payment_status'])
        return Response(BookingDetailSerializer(booking).data)


class BookingLedgerView(APIView):
    """The transparent money-flow for one booking: tourist payment → recipients."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            booking = Booking.objects.get(
                pk=pk
            )
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.role in STAFF_ROLES or user.is_staff or booking.customer_id == user.id or booking.provider_id == user.id):
            return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.payment_status == 'paid' and booking.payouts.exists():
            return Response({
                'booking': BookingListSerializer(booking).data,
                'preview': False,
                'payouts': [
                    {
                        'recipient_type': p.recipient_type,
                        'label': p.label,
                        'percentage': p.percentage,
                        'amount': str(p.amount),
                        'status': p.status,
                    }
                    for p in booking.payouts.all()
                ],
            })

        lines = services.compute_split(
            booking.total_amount,
            booking.experience.model_category if booking.experience else 'package',
        )
        return Response({
            'booking': BookingListSerializer(booking).data,
            'preview': True,
            'lines': SplitLineSerializer(lines, many=True).data,
            'payouts': None,
        })


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'payment_status']

    def get_queryset(self):
        return Booking.objects.filter(customer=self.request.user).select_related(
            'experience', 'package', 'family'
        )


# --------------------------------------------------------------------------- #
# Provider console
# --------------------------------------------------------------------------- #

class ProviderDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        experiences = TourismOpportunity.objects.filter(provider=user)
        bookings = Booking.objects.filter(
            Q(provider=user) | Q(experience__provider=user) | Q(package__provider=user)
        ).select_related('experience', 'package', 'customer')

        pending = bookings.filter(status='pending')
        upcoming = bookings.filter(
            status__in=['confirmed', 'pending'],
            experience_date__gte=timezone.localdate(),
        ).order_by('experience_date')

        payout_rows = (
            Booking.objects.filter(
                Q(provider=user) | Q(experience__provider=user) | Q(package__provider=user),
                payment_status='paid',
            )
            .values('payouts__recipient_type')
            .annotate(total=Sum('payouts__amount'))
        )
        earnings = {
            r['payouts__recipient_type']: r['total']
            for r in payout_rows
            if r['payouts__recipient_type']
        }

        return Response({
            'experiences': experiences.filter(is_active=True).count(),
            'total_bookings': bookings.count(),
            'pending_confirmations': pending.count(),
            'upcoming': [
                {
                    'id': str(b.id),
                    'booking_ref': b.booking_ref,
                    'title': b.title,
                    'date': b.experience_date.isoformat(),
                    'participants': b.participants,
                    'total_amount': b.total_amount,
                    'status': b.status,
                    'payment_status': b.payment_status,
                    'customer_name': b.customer.get_full_name() or b.customer.username,
                }
                for b in upcoming[:20]
            ],
            'earnings': earnings,
        })


class ProviderBookingActionView(APIView):
    """POST {action: confirm|complete|cancel} for a booking on my listings."""

    permission_classes = [permissions.IsAuthenticated]

    ALLOWED = {
        'confirm': 'confirmed',
        'complete': 'completed',
        'cancel': 'cancelled',
        'decline': 'cancelled',
    }

    def post(self, request, pk):
        user = request.user
        try:
            booking = Booking.objects.get(
                Q(pk=pk),
                Q(provider=user) | Q(experience__provider=user) | Q(package__provider=user),
            )
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found on your listings.'},
                            status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action not in self.ALLOWED:
            return Response({'error': f'Action must be one of {list(self.ALLOWED)}'},
                            status=status.HTTP_400_BAD_REQUEST)

        new_status = self.ALLOWED[action]
        if action == 'cancel' and booking.payment_status == 'paid':
            booking.payment_status = 'refunded'
            booking.payouts.update(status='reversed')
            booking.save(update_fields=['payment_status'])
        booking.status = new_status
        booking.save(update_fields=['status'])
        return Response(BookingDetailSerializer(booking).data)


# --------------------------------------------------------------------------- #
# Reviews
# --------------------------------------------------------------------------- #

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    filterset_fields = ['experience', 'package', 'rating']
    ordering_fields = ['created_at', 'rating']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Review.objects.filter(is_approved=True).select_related('user', 'experience', 'package')

    def perform_create(self, serializer):
        user = self.request.user
        experience = serializer.validated_data.get('experience')
        package = serializer.validated_data.get('package')

        if not experience and not package:
            raise ValidationError('Either experience or package is required.')

        existing = Review.objects.filter(user=user, experience=experience, package=package).first()
        if existing:
            raise ValidationError('You have already reviewed this listing.')

        verified = False
        booking_ref = self.request.data.get('booking')
        if booking_ref:
            booking = Booking.objects.filter(
                pk=booking_ref, customer=user, payment_status='paid'
            ).first()
            if booking and (
                (experience and booking.experience_id == experience.id)
                or (package and booking.package_id == package.id)
            ):
                verified = True

        review = serializer.save(user=user, is_verified_stay=verified)
        self._refresh_targets(review)

    def _refresh_targets(self, review):
        if review.experience:
            agg = review.experience.reviews.filter(is_approved=True).aggregate(
                r=Avg('rating'), c=Count('id')
            )
            TourismOpportunity.objects.filter(pk=review.experience_id).update(
                rating=round(agg['r'] or 0, 2), total_reviews=agg['c'] or 0
            )
        if review.package:
            agg = review.package.reviews.filter(is_approved=True).aggregate(
                r=Avg('rating'), c=Count('id')
            )
            ExperiencePackage.objects.filter(pk=review.package_id).update(
                rating=round(agg['r'] or 0, 2), total_reviews=agg['c'] or 0
            )


# --------------------------------------------------------------------------- #
# Lean season
# --------------------------------------------------------------------------- #

class LeanSeasonView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        simulate = request.query_params.get('simulate') in ('1', 'true', 'True')
        ctx = services.lean_season_context(state=state, district=district, simulate=simulate)

        experiences = list(ExperienceListSerializer(ctx['experiences'][:30], many=True).data)
        packages = ExperiencePackageListSerializer(ctx['packages'][:10], many=True).data

        return Response({
            'active': ctx['active'],
            'simulated': ctx.get('simulated', False),
            'checked_on': ctx['checked_on'],
            'message': ctx['message'],
            'windows': ctx['windows'],
            'profile': ctx['profile'],
            'experiences': experiences,
            'packages': packages,
        })


# --------------------------------------------------------------------------- #
# Map points
# --------------------------------------------------------------------------- #

class MapPointsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        points = []

        for e in TourismOpportunity.objects.filter(
            is_active=True, latitude__isnull=False, longitude__isnull=False
        ).select_related('village', 'family'):
            points.append({
                'type': 'experience',
                'id': str(e.id),
                'slug': e.slug,
                'name': e.name,
                'category': e.model_category,
                'price': float(e.price_min) if e.price_min is not None else None,
                'price_unit': e.price_unit,
                'rating': e.rating,
                'village': e.village.name if e.village else None,
                'latitude': e.latitude,
                'longitude': e.longitude,
                'blocked': services.is_offshore_blocked(e),
            })

        for p in ExperiencePackage.objects.filter(
            is_active=True, latitude__isnull=False, longitude__isnull=False
        ).select_related('village'):
            points.append({
                'type': 'package',
                'id': str(p.id),
                'name': p.title,
                'category': p.model_category,
                'price': float(p.price),
                'price_unit': 'group',
                'rating': p.rating,
                'village': p.village.name if p.village else None,
                'latitude': p.latitude,
                'longitude': p.longitude,
                'blocked': False,
            })

        for b in LocalBusiness.objects.filter(
            is_active=True, latitude__isnull=False, longitude__isnull=False
        ).select_related('village'):
            points.append({
                'type': 'business',
                'id': str(b.id),
                'name': b.name,
                'category': b.category,
                'price': None,
                'price_unit': None,
                'rating': b.rating,
                'village': b.village.name if b.village else None,
                'latitude': b.latitude,
                'longitude': b.longitude,
                'blocked': False,
            })

        return Response({'count': len(points), 'points': points})


# --------------------------------------------------------------------------- #
# Cleanups & businesses (legacy CRUD, ownership-scoped writes)
# --------------------------------------------------------------------------- #

class BeachCleanupEventListView(generics.ListAPIView):
    serializer_class = BeachCleanupEventSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['beach']
    ordering_fields = ['cleanup_date', 'participants_count']
    queryset = BeachCleanupEvent.objects.select_related(
        'beach', 'event', 'organized_by',
    ).prefetch_related('photos').all()


class BeachCleanupEventDetailView(generics.RetrieveAPIView):
    serializer_class = BeachCleanupEventSerializer
    permission_classes = [permissions.AllowAny]
    queryset = BeachCleanupEvent.objects.select_related(
        'beach', 'event', 'organized_by', 'contribution__user',
    ).prefetch_related('photos').all()

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field or 'pk')
        qs = self.filter_queryset(self.get_queryset())
        obj = qs.filter(slug=lookup).first()
        if obj is not None:
            return obj
        try:
            return qs.get(pk=lookup)
        except (BeachCleanupEvent.DoesNotExist, DjangoValidationError, ValueError, TypeError):
            raise Http404(f'No BeachCleanupEvent found matching {lookup!r}')


class BeachCleanupEventCreateView(generics.CreateAPIView):
    serializer_class = BeachCleanupEventCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(organized_by=self.request.user)


class BeachCleanupPhotoUploadView(generics.CreateAPIView):
    """POST /ecotourism/cleanups/<pk>/photos/ — multipart upload."""
    serializer_class = BeachCleanupPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_cleanup(self):
        lookup = self.kwargs['pk']
        qs = BeachCleanupEvent.objects.select_related(
            'organized_by', 'contribution__user',
        ).all()
        obj = qs.filter(slug=lookup).first()
        if obj is None:
            try:
                obj = qs.get(pk=lookup)
            except (BeachCleanupEvent.DoesNotExist, DjangoValidationError, ValueError, TypeError):
                raise Http404(f'No BeachCleanupEvent found matching {lookup!r}')
        return obj

    def create(self, request, *args, **kwargs):
        cleanup = self.get_cleanup()
        if not _can_manage_cleanup(request.user, cleanup):
            return Response(
                {'detail': 'You do not have permission to add photos to this clean-up.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        photo = serializer.save(
            cleanup=cleanup,
            uploaded_by=request.user,
            sort_order=cleanup.photos.count(),
        )
        cleanup.photos_count = cleanup.photos.count()
        cleanup.save(update_fields=['photos_count'])
        return Response(
            BeachCleanupPhotoSerializer(photo, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class BeachCleanupPhotoDeleteView(generics.DestroyAPIView):
    """DELETE /ecotourism/cleanups/photos/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]
    queryset = BeachCleanupPhoto.objects.select_related('cleanup').all()

    def destroy(self, request, *args, **kwargs):
        photo = self.get_object()
        cleanup = photo.cleanup
        if not _can_manage_cleanup(request.user, cleanup):
            return Response(
                {'detail': 'You do not have permission to delete photos from this clean-up.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        photo.delete()
        cleanup.photos_count = cleanup.photos.count()
        cleanup.save(update_fields=['photos_count'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LocalBusinessListView(generics.ListAPIView):
    serializer_class = LocalBusinessListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'village', 'is_sustainable', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['rating', 'name']
    queryset = LocalBusiness.objects.select_related('village').filter(is_active=True)


class LocalBusinessDetailView(generics.RetrieveAPIView):
    serializer_class = LocalBusinessDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = LocalBusiness.objects.select_related('beach', 'village').all()


class LocalBusinessCreateView(generics.CreateAPIView):
    serializer_class = LocalBusinessCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class LocalBusinessUpdateView(generics.UpdateAPIView):
    serializer_class = LocalBusinessCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return LocalBusiness.objects.all()
        return LocalBusiness.objects.filter(owner=user)


class LocalBusinessDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in STAFF_ROLES or user.is_staff:
            return LocalBusiness.objects.all()
        return LocalBusiness.objects.filter(owner=user)


# --------------------------------------------------------------------------- #
# Calibrate locations to exact land-based harbours, jetties & village centres
# --------------------------------------------------------------------------- #

LAND_CALIBRATION = {
    'Neendakara': {
        'lat': 8.9388,
        'lng': 76.5422,
        'meeting_point': 'Neendakara Fishing Harbour, Gate 2 Landing Quay, Kollam, Kerala 691582',
        'phone': '+91 94470 31820',
    },
    'Besant Nagar': {
        'lat': 13.0012,
        'lng': 80.2682,
        'meeting_point': 'Urur Olcott Kuppam Fisher Community Centre, Besant Nagar, Chennai, Tamil Nadu 600090',
        'phone': '+91 94440 28192',
    },
    'Ennore': {
        'lat': 13.2165,
        'lng': 80.3160,
        'meeting_point': 'Ennore Fishing Harbour & Net Weaving Yard, Harbour Road, Chennai, Tamil Nadu 600057',
        'phone': '+91 94440 28192',
    },
    'Vypin': {
        'lat': 10.0245,
        'lng': 76.2205,
        'meeting_point': 'Vypin Mangrove & Backwater Boat Jetty, Njarakkal, Vypin Island, Ernakulam, Kerala 682505',
        'phone': '+91 94470 31820',
    },
    'Alanthalai': {
        'lat': 8.4682,
        'lng': 78.1325,
        'meeting_point': 'Alanthalai Coastal Community Green, Tiruchendur Road, Thoothukudi, Tamil Nadu 628206',
        'phone': '+91 94440 28192',
    },
    'Kakinada': {
        'lat': 16.9635,
        'lng': 82.2475,
        'meeting_point': 'Kakinada Fishing Harbour Wharf Gate, Jagannaickpur, Kakinada, Andhra Pradesh 533002',
        'phone': '+91 94401 77319',
    },
    'Karwar': {
        'lat': 14.8085,
        'lng': 74.1310,
        'meeting_point': 'Baithkol Fishing Harbour Wharf, Karwar, Karnataka 581302',
        'phone': '+91 94480 62145',
    },
    'Malpe': {
        'lat': 13.3540,
        'lng': 74.7045,
        'meeting_point': 'Malpe Fishing Harbour Main Office Quay, Malpe, Udupi, Karnataka 576108',
        'phone': '+91 94480 62145',
    },
    'Arthunkal': {
        'lat': 9.6645,
        'lng': 76.2940,
        'meeting_point': 'Arthunkal Beach Road Fish Landing Centre, Cherthala, Alappuzha, Kerala 688530',
        'phone': '+91 94470 31820',
    },
    'Vizhinjam': {
        'lat': 8.3805,
        'lng': 76.9920,
        'meeting_point': 'Vizhinjam Fishing Harbour Fish Landing Centre, Thiruvananthapuram, Kerala 695521',
        'phone': '+91 94470 31820',
    },
    'Chinnamuttom': {
        'lat': 8.0945,
        'lng': 77.5620,
        'meeting_point': 'Chinnamuttom Fishing Harbour & Boat Building Yard, Kanyakumari, Tamil Nadu 629702',
        'phone': '+91 94440 28192',
    },
    'Rushikonda': {
        'lat': 17.7825,
        'lng': 83.3820,
        'meeting_point': 'Rushikonda Beach Water Sports Jetty Entrance, Visakhapatnam, Andhra Pradesh 530045',
        'phone': '+91 94401 77319',
    },
    'Suryalanka': {
        'lat': 15.8450,
        'lng': 80.5280,
        'meeting_point': 'Suryalanka Beach Gate & APTDC Coastal Point, Bapatla, Andhra Pradesh 522101',
        'phone': '+91 94401 77319',
    },
    'Mogalthur': {
        'lat': 16.4210,
        'lng': 81.6580,
        'meeting_point': 'Mogalthur Riverbank Estuary Landing, West Godavari, Andhra Pradesh 534281',
        'phone': '+91 94401 77319',
    },
    'Covelong': {
        'lat': 12.7890,
        'lng': 80.2510,
        'meeting_point': 'Kovalam Fishing Village & Surf Point, ECR, Chennai, Tamil Nadu 603112',
        'phone': '+91 94440 28192',
    },
    'Mahabalipuram': {
        'lat': 12.6170,
        'lng': 80.1980,
        'meeting_point': 'Mahabalipuram Fishermen Colony & Othavadai Street, Tamil Nadu 603104',
        'phone': '+91 94440 28192',
    },
    'Pondicherry': {
        'lat': 11.9335,
        'lng': 79.8350,
        'meeting_point': 'Pondicherry Promenade Heritage Point, Goubert Avenue, Puducherry 605001',
        'phone': '+91 94440 28192',
    },
    'Pulicat': {
        'lat': 13.4210,
        'lng': 80.3180,
        'meeting_point': 'Pulicat Lake Boat Jetty & Forest Rest House, Tiruvallur, Tamil Nadu 601205',
        'phone': '+91 94440 28192',
    },
}


def apply_land_calibration():
    """Update all FisherFamily, TourismOpportunity, and ExperiencePackage records to exact land coordinates."""
    updated_counts = {'families': 0, 'experiences': 0, 'packages': 0}

    # 1. Update Fisher Families
    for fam in FisherFamily.objects.all():
        matched = None
        for vname, data in LAND_CALIBRATION.items():
            if (fam.village and vname.lower() in fam.village.name.lower()) or (vname.lower() in fam.name.lower()):
                matched = data
                break
        if matched:
            fam.latitude = matched['lat']
            fam.longitude = matched['lng']
            fam.phone = matched['phone']
            fam.is_verified = True
            fam.save(update_fields=['latitude', 'longitude', 'phone', 'is_verified'])
            updated_counts['families'] += 1

    # 2. Update Tourism Opportunities
    for exp in TourismOpportunity.objects.all():
        matched = None
        for vname, data in LAND_CALIBRATION.items():
            if (exp.village and vname.lower() in exp.village.name.lower()) or (vname.lower() in exp.name.lower()) or (exp.beach and vname.lower() in exp.beach.name.lower()):
                matched = data
                break
            if exp.family and ((exp.family.village and vname.lower() in exp.family.village.name.lower()) or (vname.lower() in exp.family.name.lower())):
                matched = data
                break
        if matched:
            exp.latitude = matched['lat']
            exp.longitude = matched['lng']
            if not exp.meeting_point or 'landing' in exp.meeting_point.lower() or 'harbour' in exp.meeting_point.lower():
                exp.meeting_point = matched['meeting_point']
            exp.save(update_fields=['latitude', 'longitude', 'meeting_point'])
            updated_counts['experiences'] += 1

    # 3. Update Packages
    for pkg in ExperiencePackage.objects.all():
        matched = None
        for vname, data in LAND_CALIBRATION.items():
            if (pkg.village and vname.lower() in pkg.village.name.lower()) or (vname.lower() in pkg.title.lower()):
                matched = data
                break
        if matched:
            pkg.latitude = matched['lat']
            pkg.longitude = matched['lng']
            pkg.save(update_fields=['latitude', 'longitude'])
            updated_counts['packages'] += 1

    return updated_counts


class CalibrateLocationsView(APIView):
    """Calibrate all coastal ecotourism coordinates to exact onshore harbour wharfs & landing centres."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        counts = apply_land_calibration()
        return Response({
            'status': 'success',
            'message': 'All coastal coordinates successfully calibrated to exact onshore harbour and landing points.',
            'calibrated': counts,
        })


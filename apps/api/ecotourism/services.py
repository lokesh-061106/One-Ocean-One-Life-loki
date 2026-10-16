"""Business logic for O3L ecotourism: revenue split, lean-season windows, bookings."""

import calendar
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Q
from django.utils import timezone

from .models import (
    Booking,
    BookingPayout,
    MODEL_CATEGORIES,
    SplitRule,
    TourismOpportunity,
)

TWO_PLACES = Decimal('0.01')

DEFAULT_SPLIT = {
    'provider': Decimal('80'),
    'village': Decimal('10'),
    'platform': Decimal('5'),
    'conservation': Decimal('5'),
}

RECIPIENT_LABELS = {
    'provider': 'Service provider / family income',
    'village': 'Village & community fund',
    'platform': 'O3L platform',
    'conservation': 'Safety, environment & insurance reserve',
}


# --------------------------------------------------------------------------- #
# Revenue split
# --------------------------------------------------------------------------- #

def get_split_rule(scope: str = 'default') -> SplitRule:
    """Return the active split rule for a scope, falling back to the default rule."""
    if scope and scope != 'default':
        rule = SplitRule.objects.filter(is_active=True, scope=scope).first()
        if rule:
            return rule
    rule = SplitRule.objects.filter(is_active=True, scope='default').first()
    if rule:
        return rule
    rule = SplitRule.objects.filter(is_active=True).first()
    if rule:
        return rule
    # No rule configured — build an unsaved default so callers always work.
    rule = SplitRule(
        name='O3L standard split (built-in default)',
        scope='default',
        is_default=True,
        provider_pct=DEFAULT_SPLIT['provider'],
        village_pct=DEFAULT_SPLIT['village'],
        platform_pct=DEFAULT_SPLIT['platform'],
        conservation_pct=DEFAULT_SPLIT['conservation'],
    )
    return rule


def compute_split(total, scope: str = 'default') -> list:
    """
    Split `total` into the 4 transparent ledger lines.

    Returns a list of dicts: {recipient_type, percentage, amount}.
    The conservation line absorbs any rounding difference so the
    four amounts always re-sum to exactly `total`.
    """
    total = Decimal(str(total)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    rule = get_split_rule(scope)

    provider = (total * rule.provider_pct / 100).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    village = (total * rule.village_pct / 100).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    platform = (total * rule.platform_pct / 100).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    conservation = total - provider - village - platform

    amounts = {
        'provider': provider,
        'village': village,
        'platform': platform,
        'conservation': conservation,
    }
    pcts = {
        'provider': rule.provider_pct,
        'village': rule.village_pct,
        'platform': rule.platform_pct,
        'conservation': rule.conservation_pct,
    }
    return [
        {
            'recipient_type': rt,
            'label': RECIPIENT_LABELS[rt],
            'percentage': pcts[rt],
            'amount': amounts[rt],
        }
        for rt in ('provider', 'village', 'platform', 'conservation')
    ]


def create_payouts(booking: Booking) -> list:
    """Create BookingPayout ledger rows for a paid booking (idempotent)."""
    if booking.payouts.exists():
        return list(booking.payouts.all())

    rule = booking.split_rule or get_split_rule(
        booking.experience.model_category if booking.experience else 'package'
    )
    booking.split_rule = rule if rule.pk else None

    family = booking.family
    village = None
    if booking.experience:
        village = booking.experience.village
    elif booking.package:
        village = booking.package.village
    if family and family.village_id:
        village = family.village

    lines = compute_split(booking.total_amount, rule.scope if rule.pk else 'default')
    payouts = []
    for line in lines:
        label = line['label']
        family_for_line = None
        if line['recipient_type'] == 'provider':
            family_for_line = family
            if family:
                label = family.name
            elif village:
                label = f'{village.name} fishing family'
        elif line['recipient_type'] == 'village' and village:
            label = f'{village.name} village & community fund'
        payouts.append(
            BookingPayout(
                booking=booking,
                recipient_type=line['recipient_type'],
                family=family_for_line,
                label=label,
                percentage=line['percentage'],
                amount=line['amount'],
            )
        )
    BookingPayout.objects.bulk_create(payouts)
    if booking.split_rule_id is None:
        booking.save(update_fields=['split_rule'])
    return payouts


# --------------------------------------------------------------------------- #
# Lean-season / fishing-ban windows
# --------------------------------------------------------------------------- #

def _is_date_in_window(today: date, start_month, start_day, end_month, end_day) -> bool:
    if not start_month or not end_month:
        return False
    s_day = start_day or 1
    if end_day:
        e_day = end_day
    else:
        e_day = calendar.monthrange(2000, end_month)[1]
    cur = (today.month, today.day)
    start = (start_month, s_day)
    end = (end_month, e_day)
    if start <= end:
        return start <= cur <= end
    return cur >= start or cur <= end


def active_lean_windows(state: str = None, district: str = None, on_date: date = None) -> list:
    """
    Return lean/ban windows active today.

    Each item: {id, state, district, region_label, typical_period, main_reason,
                start_month, start_day, end_month, end_day, profile_id}
    """
    from locations.models import StateLeanPeriod

    on_date = on_date or timezone.localdate()
    qs = StateLeanPeriod.objects.select_related('profile').filter(
        start_month__isnull=False, end_month__isnull=False
    )
    if state:
        qs = qs.filter(profile__state__iexact=state)
    if district:
        qs = qs.filter(Q(district__iexact=district) | Q(district=''))

    windows = []
    for p in qs:
        if _is_date_in_window(on_date, p.start_month, p.start_day, p.end_month, p.end_day):
            windows.append({
                'id': str(p.id),
                'state': p.profile.state,
                'district': p.district,
                'region_label': p.region_label,
                'typical_period': p.typical_period,
                'main_reason': p.main_reason,
                'start_month': p.start_month,
                'start_day': p.start_day,
                'end_month': p.end_month,
                'end_day': p.end_day,
                'profile_id': str(p.profile_id),
                'ban_relief_text': p.profile.ban_relief_text,
                'lean_allowance_text': p.profile.lean_allowance_text,
            })
    return windows


def is_offshore_blocked(experience: TourismOpportunity, on_date: date = None) -> bool:
    """
    An offshore experience is blocked when it falls inside an active
    fishing-ban/lean window covering its state or district.
    """
    if not experience.is_offshore:
        return False
    state = None
    district = None
    v = experience.village
    if v and v.district_id:
        district = v.district.name
        state = v.district.state
    windows = active_lean_windows(state=state, district=district, on_date=on_date)
    return bool(windows)


def lean_season_context(state: str = None, district: str = None, on_date: date = None, simulate: bool = False) -> dict:
    """Full lean-season payload for the app banner + filtered listings."""
    on_date = on_date or timezone.localdate()
    windows = active_lean_windows(state=state, district=district, on_date=on_date)

    if simulate and not windows:
        from locations.models import StateLeanPeriod
        qs = StateLeanPeriod.objects.select_related('profile').filter(
            start_month__isnull=False, end_month__isnull=False
        )
        if state:
            qs = qs.filter(profile__state__iexact=state)
        if district:
            qs = qs.filter(Q(district__iexact=district) | Q(district=''))
        for p in qs[:6]:
            windows.append({
                'id': str(p.id),
                'state': p.profile.state,
                'district': p.district,
                'region_label': p.region_label,
                'typical_period': p.typical_period,
                'main_reason': p.main_reason,
                'start_month': p.start_month,
                'start_day': p.start_day,
                'end_month': p.end_month,
                'end_day': p.end_day,
                'profile_id': str(p.profile_id),
                'ban_relief_text': p.profile.ban_relief_text,
                'lean_allowance_text': p.profile.lean_allowance_text,
            })

    active = bool(windows) or bool(simulate)

    experiences = TourismOpportunity.objects.filter(
        is_active=True, lean_season_friendly=True
    ).select_related('village', 'family', 'beach')
    if state:
        experiences = experiences.filter(
            Q(village__district__state__iexact=state) | Q(village__isnull=True)
        )
    if district:
        experiences = experiences.filter(
            Q(village__district__name__iexact=district) | Q(village__isnull=True)
        )

    from .models import ExperiencePackage
    packages = ExperiencePackage.objects.filter(is_active=True).select_related('village')

    profile = None
    if windows:
        from locations.models import StateFisheriesProfile
        prof = StateFisheriesProfile.objects.filter(
            state__iexact=windows[0]['state']
        ).first()
        if prof:
            profile = {
                'state': prof.state,
                'ban_relief_text': prof.ban_relief_text,
                'lean_allowance_text': prof.lean_allowance_text,
                'period_remarks': prof.period_remarks,
            }

    message = ''
    if active:
        regions = ', '.join(sorted({w['region_label'] or w['state'] for w in windows})) if windows else (state or 'Tamil Nadu, Kerala, Karnataka & Andhra Pradesh')
        message = (
            'Fishing activity is seasonally restricted in '
            f'{regions}. Explore alternative income opportunities in your village.'
        )

    return {
        'active': active,
        'simulated': bool(simulate),
        'checked_on': on_date.isoformat(),
        'message': message,
        'windows': windows,
        'profile': profile,
        'experiences': experiences,
        'packages': packages,
    }


# --------------------------------------------------------------------------- #
# Booking helpers
# --------------------------------------------------------------------------- #

def generate_booking_ref() -> str:
    return f"O3L-ECO-{uuid.uuid4().hex[:8].upper()}"


def compute_booking_total(unit_price, participants: int, price_unit: str) -> 'Decimal':
    unit = Decimal(str(unit_price or 0)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    if price_unit in ('person', 'student'):
        return (unit * max(participants, 1)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return unit


def booking_scope(booking: Booking) -> str:
    if booking.experience:
        return booking.experience.model_category
    if booking.package:
        return 'package'
    return 'default'


def next_day_from_today() -> date:
    return timezone.localdate() + timedelta(days=1)


def payment_gateway_configured() -> bool:
    import os
    return bool(os.environ.get('RAZORPAY_KEY_ID') and os.environ.get('RAZORPAY_KEY_SECRET'))


def is_demo_payment(order_id: str) -> bool:
    """True when we fell back to simulated payments (no gateway keys configured)."""
    return bool(order_id) and order_id.startswith('order_demo_')


def create_gateway_order(booking: Booking) -> dict:
    """
    Create a Razorpay order for the booking. Falls back to a simulated
    demo order when gateway keys are not configured (dev/demo mode).
    """
    amount = float(booking.total_amount)
    if payment_gateway_configured():
        from marketplace.webhooks import create_razorpay_order
        order = create_razorpay_order(amount, receipt=booking.booking_ref)
        booking.razorpay_order_id = order['id']
        booking.payment_method = 'razorpay'
        booking.save(update_fields=['razorpay_order_id', 'payment_method'])
        return {
            'mode': 'live',
            'order_id': order['id'],
            'amount': amount,
            'currency': 'INR',
            'booking_ref': booking.booking_ref,
        }

    demo_id = f'order_demo_{uuid.uuid4().hex[:12]}'
    booking.razorpay_order_id = demo_id
    booking.payment_method = 'demo'
    booking.save(update_fields=['razorpay_order_id', 'payment_method'])
    return {
        'mode': 'demo',
        'order_id': demo_id,
        'amount': amount,
        'currency': 'INR',
        'booking_ref': booking.booking_ref,
    }


def verify_and_capture(booking: Booking, payment_id: str, order_id: str, signature: str) -> tuple:
    """
    Verify the payment and mark the booking paid.
    Returns (ok: bool, error: str|None).
    """
    if booking.razorpay_order_id and order_id != booking.razorpay_order_id:
        return False, 'Order id does not match this booking.'

    if is_demo_payment(order_id):
        verified = True
    else:
        from marketplace.webhooks import verify_razorpay_payment
        verified = verify_razorpay_payment(payment_id, order_id, signature)
        if not verified:
            return False, 'Payment verification failed.'

    booking.razorpay_payment_id = payment_id
    booking.razorpay_signature = signature
    booking.payment_status = 'paid'
    booking.status = 'confirmed'
    booking.paid_at = timezone.now()
    booking.save(update_fields=[
        'razorpay_payment_id', 'razorpay_signature',
        'payment_status', 'status', 'paid_at',
    ])

    if booking.experience:
        TourismOpportunity.objects.filter(pk=booking.experience_id).update(
            total_bookings=booking.experience.total_bookings + 1
        )
    elif booking.package:
        from .models import ExperiencePackage
        ExperiencePackage.objects.filter(pk=booking.package_id).update(
            total_bookings=booking.package.total_bookings + 1
        )

    create_payouts(booking)
    return True, None

"""Advice generation engine for targeted financial recommendations."""

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Case, IntegerField, Value, When

from analytics.services import get_category_breakdown, get_dashboard_summary
from recommendations.models import Recommendation, RecommendationPriority


MIN_RECOMMENDATIONS = 3
MAX_RECOMMENDATIONS = 6


def _month_start(value):
    """Return first day of the given date's month."""
    return value.replace(day=1)


def _add_months(month_start, offset):
    """Shift month-start date by offset months."""
    year = month_start.year + ((month_start.month - 1 + offset) // 12)
    month = ((month_start.month - 1 + offset) % 12) + 1
    return date(year, month, 1)


def _priority_ordering(queryset):
    """Order recommendations by business priority and recency."""
    return queryset.annotate(
        priority_rank=Case(
            When(priority=RecommendationPriority.HIGH, then=Value(1)),
            When(priority=RecommendationPriority.MEDIUM, then=Value(2)),
            default=Value(3),
            output_field=IntegerField(),
        )
    ).order_by("priority_rank", "-created_at")


def _append_recommendation(items, message, priority):
    """Append recommendation without exceeding max count."""
    if len(items) < MAX_RECOMMENDATIONS:
        items.append({"message": message, "priority": priority})


def generate_recommendations(user):
    """Generate and persist targeted recommendations for a user."""
    current_month = _month_start(date.today())
    previous_month = _add_months(current_month, -1)

    current_summary = get_dashboard_summary(user, month=current_month)
    previous_summary = get_dashboard_summary(user, month=previous_month)
    breakdown = get_category_breakdown(user, month=current_month)

    recommendations_to_create = []

    savings_rate = Decimal(current_summary["savings_rate"])
    if savings_rate < Decimal("10.00"):
        _append_recommendation(
            recommendations_to_create,
            "Your savings rate is critically low. Prioritize reducing discretionary expenses immediately.",
            RecommendationPriority.HIGH,
        )
    elif savings_rate < Decimal("20.00"):
        _append_recommendation(
            recommendations_to_create,
            "Consider increasing savings to 20% by setting a stricter monthly budget target.",
            RecommendationPriority.MEDIUM,
        )
    elif savings_rate > Decimal("30.00"):
        _append_recommendation(
            recommendations_to_create,
            "Great job! You're saving over 30%. Keep reinforcing the habits that drive this outcome.",
            RecommendationPriority.LOW,
        )

    previous_expense = Decimal(previous_summary["expenses"])
    current_expense = Decimal(current_summary["expenses"])
    if previous_expense > 0:
        change_pct = ((current_expense - previous_expense) / previous_expense) * Decimal("100.00")
        if change_pct > Decimal("15.00"):
            _append_recommendation(
                recommendations_to_create,
                f"Your spending jumped {round(change_pct, 2)}% this month. Review recent high-value transactions.",
                RecommendationPriority.HIGH,
            )

    if breakdown and current_expense > 0:
        top_category = breakdown[0]
        top_share = Decimal(top_category["percentage"])
        if top_share > Decimal("40.00"):
            _append_recommendation(
                recommendations_to_create,
                f"Category {top_category['category']} represents over 40% of expenses. Set a targeted cap for it.",
                RecommendationPriority.MEDIUM,
            )

    _append_recommendation(
        recommendations_to_create,
        "Track weekly spending to catch budget drift before month-end.",
        RecommendationPriority.MEDIUM,
    )
    _append_recommendation(
        recommendations_to_create,
        "Automate transfers to savings on payday to improve consistency.",
        RecommendationPriority.LOW,
    )
    _append_recommendation(
        recommendations_to_create,
        "Review recurring subscriptions quarterly and cancel underused services.",
        RecommendationPriority.MEDIUM,
    )

    recommendations_to_create = recommendations_to_create[:MAX_RECOMMENDATIONS]
    while len(recommendations_to_create) < MIN_RECOMMENDATIONS:
        _append_recommendation(
            recommendations_to_create,
            "Create a monthly spending plan aligned to your income goals.",
            RecommendationPriority.MEDIUM,
        )

    with transaction.atomic():
        Recommendation.objects.filter(user=user).delete()
        Recommendation.objects.bulk_create(
            [Recommendation(user=user, **item) for item in recommendations_to_create]
        )

    return _priority_ordering(Recommendation.objects.filter(user=user))


def get_recommendations(user):
    """Return saved recommendations ordered by priority and recency."""
    return _priority_ordering(Recommendation.objects.filter(user=user))

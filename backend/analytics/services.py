"""Analytics computation engine for dashboard and trend insights."""

from datetime import date
from decimal import Decimal

from django.db.models import Sum

from transactions.models import Transaction, TransactionType


def get_month_start(target_date):
    """Normalize a date to the first day of month."""
    return target_date.replace(day=1)


def add_months(month_start, offset):
    """Return a month-start date shifted by offset months."""
    year = month_start.year + ((month_start.month - 1 + offset) // 12)
    month = ((month_start.month - 1 + offset) % 12) + 1
    return date(year, month, 1)


def parse_or_current_month(month=None):
    """Use the supplied month or current month start."""
    if month:
        return get_month_start(month)
    return date.today().replace(day=1)


def _monthly_transaction_qs(user, month_start):
    """Return user transactions scoped to a specific month."""
    next_month = add_months(month_start, 1)
    return Transaction.objects.filter(user=user, date__gte=month_start, date__lt=next_month)


def get_dashboard_summary(user, month=None):
    """Return dashboard metrics including totals, savings rate, and top categories."""
    month_start = parse_or_current_month(month)
    transactions = _monthly_transaction_qs(user, month_start).select_related("category")

    total_income = transactions.filter(type=TransactionType.INCOME).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    total_expense = transactions.filter(type=TransactionType.EXPENSE).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    savings = total_income - total_expense
    savings_rate = Decimal("0.00")
    if total_income > 0:
        savings_rate = round((savings / total_income) * Decimal("100.00"), 2)

    top_categories_qs = (
        transactions.filter(type=TransactionType.EXPENSE)
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")[:3]
    )
    top_categories = [
        {"category": item["category__name"], "total": item["total"]}
        for item in top_categories_qs
    ]

    return {
        "income": total_income,
        "expenses": total_expense,
        "savings": savings,
        "savings_rate": savings_rate,
        "top_categories": top_categories,
    }


def get_spending_trend(user, months=6):
    """Return month-by-month income, expense, and savings for the last N months."""
    current_month = date.today().replace(day=1)
    start_month = add_months(current_month, -(months - 1))
    trend = []

    for index in range(months):
        month_start = add_months(start_month, index)
        data = get_dashboard_summary(user, month=month_start)
        trend.append(
            {
                "month": month_start.strftime("%Y-%m"),
                "income": data["income"],
                "expenses": data["expenses"],
                "savings": data["savings"],
            }
        )

    return trend


def get_category_breakdown(user, month=None):
    """Return expense totals and percentages grouped by category."""
    month_start = parse_or_current_month(month)
    expense_qs = _monthly_transaction_qs(user, month_start).filter(type=TransactionType.EXPENSE)

    total_expense = expense_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    grouped = expense_qs.values("category__name").annotate(total=Sum("amount")).order_by("-total")

    result = []
    for item in grouped:
        percentage = Decimal("0.00")
        if total_expense > 0:
            percentage = round((item["total"] / total_expense) * Decimal("100.00"), 2)
        result.append(
            {
                "category": item["category__name"],
                "total": item["total"],
                "percentage": percentage,
            }
        )

    return result

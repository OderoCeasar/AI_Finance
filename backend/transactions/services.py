"""Business services for transaction categorization and summary calculations."""

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from transactions.models import Category, MonthlySummary, Transaction, TransactionType


GLOBAL_CATEGORY_NAMES = [
    "Food",
    "Transport",
    "Housing",
    "Health",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Salary",
    "Other",
]

CATEGORY_KEYWORDS = {
    "Food": ["uber eats", "restaurant", "grocery", "pizza", "cafe", "food"],
    "Transport": ["uber", "bolt", "fuel", "parking", "bus", "metro", "taxi"],
    "Housing": ["rent", "mortgage", "landlord", "apartment", "housing"],
    "Health": ["pharmacy", "doctor", "hospital", "clinic", "health"],
    "Entertainment": ["netflix", "movie", "cinema", "spotify", "game", "concert"],
    "Shopping": ["amazon", "mall", "store", "shopping", "clothes"],
    "Utilities": ["electric", "water", "internet", "utility", "phone", "gas bill"],
    "Salary": ["salary", "payroll", "wage", "bonus"],
}

OTHER_CATEGORY_NAME = "Other"


def get_month_start(target_date):
    """Normalize a date to the first day of its month."""
    return target_date.replace(day=1)


def categorize_transaction(description, user=None):
    """Categorize a transaction description into the best matching category."""
    text = (description or "").lower()
    matched_name = OTHER_CATEGORY_NAME

    for category_name, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            matched_name = category_name
            break

    if user:
        user_category = Category.objects.filter(user=user, name__iexact=matched_name).first()
        if user_category:
            return user_category

    return Category.objects.get(user__isnull=True, name__iexact=matched_name)


def get_or_create_global_category(name):
    """Fetch or create a global category by name."""
    category, _ = Category.objects.get_or_create(name=name, user=None)
    return category


def initialize_global_categories():
    """Ensure default global categories exist."""
    for name in GLOBAL_CATEGORY_NAMES:
        get_or_create_global_category(name)


def compute_monthly_totals(user, month):
    """Compute income and expense totals for a given user/month."""
    month_start = get_month_start(month)
    next_month = date(month_start.year + (month_start.month // 12), ((month_start.month % 12) + 1), 1)

    month_transactions = Transaction.objects.filter(
        user=user,
        date__gte=month_start,
        date__lt=next_month,
    )

    income = month_transactions.filter(type=TransactionType.INCOME).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    expense = month_transactions.filter(type=TransactionType.EXPENSE).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    savings = income - expense

    return {
        "month": month_start,
        "total_income": income,
        "total_expense": expense,
        "savings": savings,
    }


def update_or_create_monthly_summary(user, month):
    """Persist monthly summary values for a user/month."""
    totals = compute_monthly_totals(user, month)
    with transaction.atomic():
        summary, _ = MonthlySummary.objects.update_or_create(
            user=user,
            month=totals["month"],
            defaults={
                "total_income": totals["total_income"],
                "total_expense": totals["total_expense"],
                "savings": totals["savings"],
            },
        )
    return summary

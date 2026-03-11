"""Models for financial transactions, categories, and monthly summaries."""

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class TransactionType(models.TextChoices):
    """Available transaction type choices."""

    INCOME = "income", "Income"
    EXPENSE = "expense", "Expense"


class Category(models.Model):
    """Transaction category, either global or user-defined."""

    name = models.CharField(max_length=100)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="categories",
    )

    class Meta:
        ordering = ["name"]
        unique_together = ("name", "user")

    def __str__(self):
        """Return category name."""
        return self.name


class Transaction(models.Model):
    """A financial transaction belonging to a specific user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="transactions")
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    description = models.TextField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        """Return a brief string representation of a transaction."""
        return f"{self.user.email} - {self.type} - {self.amount}"


class MonthlySummary(models.Model):
    """Monthly rollup for income, expense, and savings values."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="monthly_summaries")
    month = models.DateField()
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_expense = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    savings = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        ordering = ["-month"]
        unique_together = ("user", "month")

    def __str__(self):
        """Return a human-readable monthly summary identifier."""
        return f"{self.user.email} - {self.month.strftime('%Y-%m')}"

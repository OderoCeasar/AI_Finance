"""Models for storing expense prediction outcomes."""

from decimal import Decimal

from django.conf import settings
from django.db import models


class Prediction(models.Model):
    """Stores forecasted expense for a given month and user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="predictions")
    predicted_expense = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    month = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        """Return a readable prediction summary."""
        return f"{self.user.email} - {self.month.strftime('%Y-%m')} - {self.predicted_expense}"

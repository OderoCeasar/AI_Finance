"""Models for M-Pesa connection metadata and imported transactions."""

from django.conf import settings
from django.db import models


class MpesaConnectionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONNECTED = "connected", "Connected"
    DISCONNECTED = "disconnected", "Disconnected"
    ERROR = "error", "Error"


class MpesaConnection(models.Model):
    """Represents a user's M-Pesa connection state."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mpesa_connection")
    phone_number = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=MpesaConnectionStatus.choices, default=MpesaConnectionStatus.PENDING)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.phone_number} ({self.status})"


class MpesaTransaction(models.Model):
    """Store raw M-Pesa transactions imported for a connection."""

    connection = models.ForeignKey(MpesaConnection, on_delete=models.CASCADE, related_name="transactions")
    transaction_id = models.CharField(max_length=64)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    direction = models.CharField(max_length=10, choices=[("income", "Income"), ("expense", "Expense")])
    description = models.TextField()
    transaction_date = models.DateField()
    account_reference = models.CharField(max_length=100, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("connection", "transaction_id")
        ordering = ["-transaction_date", "-created_at"]

    def __str__(self):
        return f"{self.transaction_id} - {self.amount}"

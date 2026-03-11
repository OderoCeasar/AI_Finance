"""Models for actionable personal finance recommendations."""

from django.conf import settings
from django.db import models


class RecommendationPriority(models.TextChoices):
    """Priority levels for recommendations."""

    HIGH = "high", "High"
    MEDIUM = "medium", "Medium"
    LOW = "low", "Low"


class Recommendation(models.Model):
    """A generated recommendation for a specific user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recommendations")
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=RecommendationPriority.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        """Return a readable recommendation label."""
        return f"{self.user.email} - {self.priority}"

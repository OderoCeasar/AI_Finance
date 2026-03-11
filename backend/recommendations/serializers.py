"""Serializers for recommendation resources."""

from rest_framework import serializers

from recommendations.models import Recommendation


class RecommendationSerializer(serializers.ModelSerializer):
    """Serialize recommendation records."""

    class Meta:
        model = Recommendation
        fields = ["id", "user", "message", "priority", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

"""Serializers for prediction resources."""

from rest_framework import serializers

from predictions.models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    """Serialize prediction records."""

    class Meta:
        model = Prediction
        fields = ["id", "user", "predicted_expense", "month", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

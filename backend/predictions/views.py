"""API views for expense prediction generation and retrieval."""

from django.db import DatabaseError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from predictions.models import Prediction
from predictions.serializers import PredictionSerializer
from predictions.services import predict_next_month_expense


FORECAST_MESSAGE = "Expense forecast generated successfully."
LATEST_MESSAGE = "Latest prediction retrieved successfully."
NOT_FOUND_MESSAGE = "No prediction found for this user."


def build_response(success, data, message):
    """Build a consistent API response payload."""
    return {"success": success, "data": data, "message": message}


class ForecastAPIView(APIView):
    """Run prediction engine and return newly created forecast."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Generate and persist a next-month expense prediction."""
        try:
            prediction = predict_next_month_expense(request.user)
        except ValueError as exc:
            return Response(
                build_response(False, None, str(exc)),
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DatabaseError:
            return Response(
                build_response(False, None, "We could not save the prediction."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = PredictionSerializer(prediction).data
        return Response(build_response(True, data, FORECAST_MESSAGE), status=status.HTTP_201_CREATED)


class LatestPredictionAPIView(APIView):
    """Return the most recent prediction for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Fetch latest prediction by creation timestamp."""
        prediction = Prediction.objects.filter(user=request.user).order_by("-created_at").first()
        if not prediction:
            return Response(
                build_response(False, None, NOT_FOUND_MESSAGE),
                status=status.HTTP_404_NOT_FOUND,
            )

        data = PredictionSerializer(prediction).data
        return Response(build_response(True, data, LATEST_MESSAGE), status=status.HTTP_200_OK)

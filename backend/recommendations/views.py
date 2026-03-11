"""API views for recommendation retrieval and generation."""

from django.db import DatabaseError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from recommendations.serializers import RecommendationSerializer
from recommendations.services import generate_recommendations, get_recommendations


RECOMMENDATION_LIST_MESSAGE = "Recommendations retrieved successfully."
RECOMMENDATION_GENERATE_MESSAGE = "Recommendations generated successfully."


def build_response(success, data, message):
    """Build a consistent API response payload."""
    return {"success": success, "data": data, "message": message}


class RecommendationListAPIView(APIView):
    """List recommendations for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return ordered recommendations for the current user."""
        queryset = get_recommendations(request.user)
        data = RecommendationSerializer(queryset, many=True).data
        return Response(
            build_response(True, data, RECOMMENDATION_LIST_MESSAGE),
            status=status.HTTP_200_OK,
        )


class RecommendationGenerateAPIView(APIView):
    """Generate and persist recommendations for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Run recommendation engine and return saved records."""
        try:
            queryset = generate_recommendations(request.user)
        except DatabaseError:
            return Response(
                build_response(False, None, "We could not generate recommendations."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = RecommendationSerializer(queryset, many=True).data
        return Response(
            build_response(True, data, RECOMMENDATION_GENERATE_MESSAGE),
            status=status.HTTP_201_CREATED,
        )

"""API views for analytics dashboard and insights endpoints."""

from datetime import datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.services import get_category_breakdown, get_dashboard_summary, get_spending_trend


DASHBOARD_MESSAGE = "Dashboard analytics retrieved successfully."
TREND_MESSAGE = "Spending trend retrieved successfully."
BREAKDOWN_MESSAGE = "Category breakdown retrieved successfully."
INVALID_MONTH_MESSAGE = "Invalid month format. Use YYYY-MM."


def build_response(success, data, message):
    """Build a consistent API response payload."""
    return {"success": success, "data": data, "message": message}


def parse_month_param(month_str):
    """Parse YYYY-MM query value into month start date."""
    if not month_str:
        return None
    try:
        parsed = datetime.strptime(month_str, "%Y-%m").date()
    except ValueError:
        return "invalid"
    return parsed.replace(day=1)


class DashboardAPIView(APIView):
    """Return aggregate monthly dashboard metrics for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return dashboard summary for current or requested month."""
        month = parse_month_param(request.query_params.get("month"))
        if month == "invalid":
            return Response(
                build_response(False, None, INVALID_MONTH_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = get_dashboard_summary(request.user, month=month)
        return Response(build_response(True, data, DASHBOARD_MESSAGE), status=status.HTTP_200_OK)


class SpendingTrendAPIView(APIView):
    """Return monthly trend metrics for recent months."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return spending trend for the last six months."""
        data = get_spending_trend(request.user, months=6)
        return Response(build_response(True, data, TREND_MESSAGE), status=status.HTTP_200_OK)


class CategoryBreakdownAPIView(APIView):
    """Return category-wise expense contributions for a month."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return category breakdown for current or requested month."""
        month = parse_month_param(request.query_params.get("month"))
        if month == "invalid":
            return Response(
                build_response(False, None, INVALID_MONTH_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = get_category_breakdown(request.user, month=month)
        return Response(build_response(True, data, BREAKDOWN_MESSAGE), status=status.HTTP_200_OK)

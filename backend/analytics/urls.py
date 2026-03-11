"""URL routes for analytics endpoints."""

from django.urls import path

from analytics.views import CategoryBreakdownAPIView, DashboardAPIView, SpendingTrendAPIView

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="analytics-dashboard"),
    path("spending-trend/", SpendingTrendAPIView.as_view(), name="analytics-spending-trend"),
    path("category-breakdown/", CategoryBreakdownAPIView.as_view(), name="analytics-category-breakdown"),
]

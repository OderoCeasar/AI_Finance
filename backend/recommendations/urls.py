"""URL routes for recommendation endpoints."""

from django.urls import path

from recommendations.views import RecommendationGenerateAPIView, RecommendationListAPIView

urlpatterns = [
    path("", RecommendationListAPIView.as_view(), name="recommendation-list"),
    path("generate/", RecommendationGenerateAPIView.as_view(), name="recommendation-generate"),
]

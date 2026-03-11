"""URL routes for prediction endpoints."""

from django.urls import path

from predictions.views import ForecastAPIView, LatestPredictionAPIView

urlpatterns = [
    path("forecast/", ForecastAPIView.as_view(), name="prediction-forecast"),
    path("latest/", LatestPredictionAPIView.as_view(), name="prediction-latest"),
]

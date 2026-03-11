"""URL routes for user authentication and profile endpoints."""

from django.urls import path

from users.views import LoginAPIView, ProfileAPIView, RegisterAPIView

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="auth-register"),
    path("login/", LoginAPIView.as_view(), name="auth-login"),
    path("profile/", ProfileAPIView.as_view(), name="auth-profile"),
]

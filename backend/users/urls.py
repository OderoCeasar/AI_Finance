"""URL routes for user authentication and profile endpoints."""

from django.urls import path

from users.views import (
    GoogleSignInAPIView,
    LoginAPIView,
    PasswordResetConfirmAPIView,
    PasswordResetRequestAPIView,
    ProfileAPIView,
    RefreshTokenAPIView,
    RegisterAPIView,
)

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="auth-register"),
    path("login/", LoginAPIView.as_view(), name="auth-login"),
    path("google/", GoogleSignInAPIView.as_view(), name="auth-google-signin"),
    path("profile/", ProfileAPIView.as_view(), name="auth-profile"),
    path("refresh/", RefreshTokenAPIView.as_view(), name="auth-refresh"),
    path("password-reset/", PasswordResetRequestAPIView.as_view(), name="auth-password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmAPIView.as_view(), name="auth-password-reset-confirm"),
]

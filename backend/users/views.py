"""Views for user registration, authentication, and profile retrieval."""

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import DatabaseError, transaction
from django.core.mail import send_mail
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from users.serializers import GoogleSignInSerializer, LoginSerializer, RegisterSerializer, UserProfileSerializer
from users.services import GoogleTokenVerificationError, verify_google_id_token


AUTH_REGISTERED_MESSAGE = "User registered successfully."
AUTH_LOGIN_MESSAGE = "Login successful."
AUTH_GOOGLE_LOGIN_MESSAGE = "Google sign-in successful."
PROFILE_RETRIEVED_MESSAGE = "Profile retrieved successfully."
TOKEN_REFRESH_MESSAGE = "Token refreshed successfully."
PASSWORD_RESET_REQUEST_MESSAGE = "If the account exists, a reset link was sent."
PASSWORD_RESET_CONFIRM_MESSAGE = "Password reset successful."
GENERIC_ERROR_MESSAGE = "We could not process your request."


def build_response(success, data, message):
    """Build a consistent API response payload."""
    return {"success": success, "data": data, "message": message}


def get_token_pair(user):
    """Generate JWT refresh/access tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def build_password_reset_link(user):
    """Build a frontend password reset URL with uid and token."""
    uid = urlsafe_base64_encode(str(user.pk).encode())
    token = default_token_generator.make_token(user)
    base_url = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    return f"{base_url}/ResetPasswordScreen?uid={uid}&token={token}"


class RegisterAPIView(APIView):
    """Register a new user and return profile with JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Create a user account and return credentials."""
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = serializer.save()
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_data = UserProfileSerializer(user).data
        tokens = get_token_pair(user)
        response_data = {"user": user_data, "tokens": tokens}
        return Response(
            build_response(True, response_data, AUTH_REGISTERED_MESSAGE),
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    """Authenticate a user and return JWT token pair."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate credentials and return tokens."""
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]
        tokens = get_token_pair(user)
        response_data = {"user": UserProfileSerializer(user).data, "tokens": tokens}
        return Response(
            build_response(True, response_data, AUTH_LOGIN_MESSAGE),
            status=status.HTTP_200_OK,
        )


class ProfileAPIView(APIView):
    """Return the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return profile details for the current user."""
        data = UserProfileSerializer(request.user).data
        return Response(
            build_response(True, data, PROFILE_RETRIEVED_MESSAGE),
            status=status.HTTP_200_OK,
        )


class GoogleSignInAPIView(APIView):
    """Authenticate or register a user using a Google ID token."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate Google token, then return JWT tokens for the user."""
        serializer = GoogleSignInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        id_token = serializer.validated_data["id_token"]

        try:
            claims = verify_google_id_token(id_token)
        except GoogleTokenVerificationError as exc:
            return Response(
                build_response(False, None, str(exc)),
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = claims["email"].lower()
        full_name = (claims.get("name") or claims.get("given_name") or email.split("@")[0]).strip()

        try:
            with transaction.atomic():
                user, created = User.objects.get_or_create(
                    email__iexact=email,
                    defaults={
                        "email": email,
                        "name": full_name,
                        "password": make_password(None),
                    },
                )
                if created and not user.name:
                    user.name = full_name
                    user.save(update_fields=["name"])
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                build_response(False, None, "User account is inactive."),
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = get_token_pair(user)
        response_data = {"user": UserProfileSerializer(user).data, "tokens": tokens}
        return Response(
            build_response(True, response_data, AUTH_GOOGLE_LOGIN_MESSAGE),
            status=status.HTTP_200_OK,
        )


class RefreshTokenAPIView(APIView):
    """Refresh a JWT access token using a refresh token."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Return a fresh access token."""
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                build_response(False, None, "Refresh token is required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
        except TokenError:
            return Response(
                build_response(False, None, "Refresh token is invalid."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {"access": str(refresh.access_token), "refresh": str(refresh)}
        return Response(
            build_response(True, data, TOKEN_REFRESH_MESSAGE),
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestAPIView(APIView):
    """Generate a password reset link for a user."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Send password reset link if the user exists."""
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response(
                build_response(False, {"email": ["Email is required."]}, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        reset_link = None
        if user:
            reset_link = build_password_reset_link(user)
            send_mail(
                subject="Reset your AI Finance password",
                message=(
                    "We received a request to reset your password.\n\n"
                    f"Reset link: {reset_link}\n\n"
                    "If you did not request this, ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        data = {"sent": True}
        if settings.DEBUG and reset_link:
            data["reset_link"] = reset_link
        return Response(
            build_response(True, data, PASSWORD_RESET_REQUEST_MESSAGE),
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmAPIView(APIView):
    """Confirm password reset using uid and token."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Set a new password for the user."""
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uid or not token or not new_password:
            return Response(
                build_response(False, {"detail": "Missing required fields."}, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                build_response(False, None, "Reset link is invalid."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                build_response(False, None, "Reset link is invalid or expired."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except Exception as exc:
            messages = [str(item) for item in getattr(exc, "error_list", [exc])]
            return Response(
                build_response(False, {"password": messages}, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response(
            build_response(True, None, PASSWORD_RESET_CONFIRM_MESSAGE),
            status=status.HTTP_200_OK,
        )

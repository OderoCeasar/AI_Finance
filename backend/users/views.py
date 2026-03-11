"""Views for user registration, authentication, and profile retrieval."""

from django.db import DatabaseError, transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from users.serializers import LoginSerializer, RegisterSerializer, UserProfileSerializer


AUTH_REGISTERED_MESSAGE = "User registered successfully."
AUTH_LOGIN_MESSAGE = "Login successful."
PROFILE_RETRIEVED_MESSAGE = "Profile retrieved successfully."
GENERIC_ERROR_MESSAGE = "We could not process your request."


def build_response(success, data, message):
    """Build a consistent API response payload."""
    return {"success": success, "data": data, "message": message}


def get_token_pair(user):
    """Generate JWT refresh/access tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


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

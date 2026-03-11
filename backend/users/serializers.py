"""Serializers for user authentication and profile endpoints."""

from django.contrib.auth.hashers import check_password, make_password
from rest_framework import serializers

from users.models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Serialize user profile information."""

    class Meta:
        model = User
        fields = ["id", "name", "email", "date_joined"]
        read_only_fields = ["id", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    """Validate and create a new user account."""

    class Meta:
        model = User
        fields = ["id", "name", "email", "password", "date_joined"]
        read_only_fields = ["id", "date_joined"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        """Ensure email is unique across users."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        """Create a user with hashed password."""
        validated_data["password"] = make_password(validated_data["password"])
        return User.objects.create(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Validate login credentials."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Verify email/password pair and return the user."""
        email = attrs.get("email")
        password = attrs.get("password")
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid credentials.") from exc

        if not check_password(password, user.password):
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("User account is inactive.")

        attrs["user"] = user
        return attrs


class GoogleSignInSerializer(serializers.Serializer):
    """Validate Google sign-in request payload."""

    id_token = serializers.CharField(write_only=True, allow_blank=False)

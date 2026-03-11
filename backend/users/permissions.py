"""Permission classes for user-specific object access."""

from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Allow access only to objects owned by the requesting user."""

    def has_object_permission(self, request, view, obj):
        """Return True when the object belongs to the requester."""
        return getattr(obj, "user", None) == request.user

"""API views for M-Pesa connection and import workflows."""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from mpesa.models import MpesaConnection, MpesaConnectionStatus
from mpesa.serializers import (
    MpesaConfirmSerializer,
    MpesaConnectSerializer,
    MpesaConnectionSerializer,
    MpesaImportSerializer,
)
from mpesa.services import import_transactions, parse_import_payload


def build_response(success, data, message):
    return {"success": success, "data": data, "message": message}


class MpesaStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        connection = MpesaConnection.objects.filter(user=request.user).first()
        if not connection:
            return Response(
                build_response(True, None, "No M-Pesa connection."),
                status=status.HTTP_200_OK,
            )
        data = MpesaConnectionSerializer(connection).data
        data["transactions_imported"] = connection.transactions.count()
        return Response(build_response(True, data, "M-Pesa status retrieved."), status=status.HTTP_200_OK)


class MpesaConnectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MpesaConnectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        connection, _ = MpesaConnection.objects.update_or_create(
            user=request.user,
            defaults={
                "phone_number": serializer.validated_data["phone_number"],
                "status": MpesaConnectionStatus.PENDING,
            },
        )
        data = MpesaConnectionSerializer(connection).data
        data["otp_required"] = True
        return Response(build_response(True, data, "M-Pesa connection initiated."), status=status.HTTP_200_OK)


class MpesaConfirmAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MpesaConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )
        connection = MpesaConnection.objects.filter(user=request.user).first()
        if not connection:
            return Response(
                build_response(False, None, "M-Pesa connection not found."),
                status=status.HTTP_404_NOT_FOUND,
            )
        connection.status = MpesaConnectionStatus.CONNECTED
        connection.save(update_fields=["status"])
        data = MpesaConnectionSerializer(connection).data
        return Response(build_response(True, data, "M-Pesa connection confirmed."), status=status.HTTP_200_OK)


class MpesaDisconnectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        connection = MpesaConnection.objects.filter(user=request.user).first()
        if not connection:
            return Response(
                build_response(False, None, "M-Pesa connection not found."),
                status=status.HTTP_404_NOT_FOUND,
            )
        connection.status = MpesaConnectionStatus.DISCONNECTED
        connection.save(update_fields=["status"])
        data = MpesaConnectionSerializer(connection).data
        return Response(build_response(True, data, "M-Pesa disconnected."), status=status.HTTP_200_OK)


class MpesaImportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        connection = MpesaConnection.objects.filter(user=request.user, status=MpesaConnectionStatus.CONNECTED).first()
        if not connection:
            return Response(
                build_response(False, None, "M-Pesa is not connected."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MpesaImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, "Validation failed."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        rows = parse_import_payload(serializer.validated_data.get("csv"), serializer.validated_data.get("transactions"))
        if not rows:
            return Response(
                build_response(False, None, "No transactions provided."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        imported = import_transactions(connection, rows)
        return Response(
            build_response(True, {"imported": imported}, "M-Pesa transactions imported."),
            status=status.HTTP_201_CREATED,
        )

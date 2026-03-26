"""Serializers for M-Pesa integration endpoints."""

from rest_framework import serializers

from mpesa.models import MpesaConnection, MpesaTransaction


class MpesaConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaConnection
        fields = ["phone_number", "status", "last_sync", "created_at", "updated_at"]
        read_only_fields = ["status", "last_sync", "created_at", "updated_at"]


class MpesaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaTransaction
        fields = [
            "transaction_id",
            "amount",
            "direction",
            "description",
            "transaction_date",
            "account_reference",
        ]


class MpesaConnectSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)


class MpesaConfirmSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=10)


class MpesaImportSerializer(serializers.Serializer):
    csv = serializers.CharField(required=False, allow_blank=True)
    transactions = serializers.ListField(child=serializers.DictField(), required=False)

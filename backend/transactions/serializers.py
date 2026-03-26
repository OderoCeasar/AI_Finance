"""Serializers for transaction, category, and monthly summary resources."""

from datetime import date
from decimal import Decimal

from rest_framework import serializers

from transactions.models import Budget, Category, MonthlySummary, Transaction, SavingsGoal


class CategorySerializer(serializers.ModelSerializer):
    """Serialize category details."""

    class Meta:
        model = Category
        fields = ["id", "name", "user"]
        read_only_fields = ["id", "user"]


class TransactionSerializer(serializers.ModelSerializer):
    """Serialize transactions with nested category output."""

    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "user",
            "amount",
            "category",
            "category_id",
            "type",
            "description",
            "date",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at", "category"]

    def validate_amount(self, value):
        """Ensure transaction amount is positive."""
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_date(self, value):
        """Ensure transaction date is not in the future."""
        if value > date.today():
            raise serializers.ValidationError("Date cannot be in the future.")
        return value

    def validate_category_id(self, value):
        """Restrict category selection to global or owned categories."""
        request = self.context.get("request")
        if request and value and value.user and value.user != request.user:
            raise serializers.ValidationError("You can only use your own categories.")
        return value


class MonthlySummarySerializer(serializers.ModelSerializer):
    """Serialize monthly summary totals and derived savings rate."""

    savings_rate = serializers.SerializerMethodField()

    class Meta:
        model = MonthlySummary
        fields = ["id", "user", "month", "total_income", "total_expense", "savings", "savings_rate"]
        read_only_fields = ["id", "user", "savings_rate"]

    def get_savings_rate(self, obj):
        """Return savings rate as a percentage rounded to two decimals."""
        if obj.total_income == 0:
            return Decimal("0.00")
        return round((obj.savings / obj.total_income) * Decimal("100.00"), 2)


class SavingsGoalSerializer(serializers.ModelSerializer):
    """Serialize savings goals."""

    class Meta:
        model = SavingsGoal
        fields = ["id", "user", "name", "target_amount", "current_amount", "monthly_target", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class BudgetSerializer(serializers.ModelSerializer):
    """Serialize monthly budget allocations."""

    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Budget
        fields = ["id", "user", "category", "category_id", "month", "amount", "created_at"]
        read_only_fields = ["id", "user", "created_at", "category"]

    def validate_month(self, value):
        """Normalize month values to the first day of the month."""
        return value.replace(day=1)

    def validate_category_id(self, value):
        """Ensure the category is global or owned by the requesting user."""
        request = self.context.get("request")
        if request and value and value.user and value.user != request.user:
            raise serializers.ValidationError("You can only budget for your own categories.")
        return value

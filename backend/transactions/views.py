"""Views for managing categories, transactions, and monthly summaries."""

from datetime import date, datetime
from http import HTTPStatus

from django.db import DatabaseError, transaction
from django.http import Http404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Budget, Category, Transaction
from transactions.serializers import (
    BudgetSerializer,
    CategorySerializer,
    MonthlySummarySerializer,
    TransactionSerializer,
)
from transactions.services import categorize_transaction, initialize_global_categories, update_or_create_monthly_summary


CATEGORY_LIST_MESSAGE = "Categories retrieved successfully."
CATEGORY_CREATE_MESSAGE = "Category created successfully."
BUDGET_LIST_MESSAGE = "Budgets retrieved successfully."
BUDGET_CREATE_MESSAGE = "Budget created successfully."
BUDGET_UPDATE_MESSAGE = "Budget updated successfully."
BUDGET_DELETE_MESSAGE = "Budget deleted successfully."
TRANSACTION_LIST_MESSAGE = "Transactions retrieved successfully."
TRANSACTION_CREATE_MESSAGE = "Transaction created successfully."
TRANSACTION_RETRIEVE_MESSAGE = "Transaction retrieved successfully."
TRANSACTION_UPDATE_MESSAGE = "Transaction updated successfully."
TRANSACTION_DELETE_MESSAGE = "Transaction deleted successfully."
SUMMARY_MESSAGE = "Monthly summary retrieved successfully."
VALIDATION_FAILED_MESSAGE = "Validation failed."
GENERIC_ERROR_MESSAGE = "We could not process your request."
NOT_FOUND_MESSAGE = "Resource not found."


def build_response(success, data, message):
    """Build a consistent API response payload."""
    return {"success": success, "data": data, "message": message}


def parse_month_string(month_str):
    """Parse YYYY-MM input into a month start date."""
    try:
        parsed = datetime.strptime(month_str, "%Y-%m").date()
    except (TypeError, ValueError):
        return None
    return parsed.replace(day=1)


class BudgetViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD endpoints for authenticated user budgets."""

    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return user-scoped budgets with optional filters."""
        queryset = (
            Budget.objects.select_related("category", "user")
            .filter(user=self.request.user)
            .order_by("-month", "category__name")
        )

        month = self.request.query_params.get("month")
        category = self.request.query_params.get("category")

        if month:
            month_start = parse_month_string(month)
            if month_start:
                queryset = queryset.filter(month=month_start)
        if category:
            queryset = queryset.filter(category_id=category)
        return queryset

    def list(self, request, *args, **kwargs):
        """List budgets for the current user."""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            build_response(True, serializer.data, BUDGET_LIST_MESSAGE),
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        """Create a new budget entry."""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, VALIDATION_FAILED_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                budget = serializer.save(user=request.user)
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            build_response(True, self.get_serializer(budget).data, BUDGET_CREATE_MESSAGE),
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """Update an existing budget."""
        partial = kwargs.pop("partial", False)
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                build_response(False, None, NOT_FOUND_MESSAGE),
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, VALIDATION_FAILED_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                budget = serializer.save()
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            build_response(True, self.get_serializer(budget).data, BUDGET_UPDATE_MESSAGE),
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a budget."""
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                build_response(False, None, NOT_FOUND_MESSAGE),
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            with transaction.atomic():
                instance.delete()
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            build_response(True, None, BUDGET_DELETE_MESSAGE),
            status=status.HTTP_200_OK,
        )


class CategoryListCreateAPIView(APIView):
    """List global/custom categories or create a custom category."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return global categories plus categories owned by the user."""
        initialize_global_categories()
        categories = Category.objects.filter(user__isnull=True) | Category.objects.filter(user=request.user)
        data = CategorySerializer(categories.order_by("name"), many=True).data
        return Response(build_response(True, data, CATEGORY_LIST_MESSAGE), status=status.HTTP_200_OK)

    def post(self, request):
        """Create a custom category for the authenticated user."""
        serializer = CategorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, VALIDATION_FAILED_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                category = serializer.save(user=request.user)
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            build_response(True, CategorySerializer(category).data, CATEGORY_CREATE_MESSAGE),
            status=status.HTTP_201_CREATED,
        )


class TransactionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """CRUD endpoints for authenticated user transactions."""

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return user-scoped transactions with optimized relations."""
        queryset = (
            Transaction.objects.select_related("category", "user")
            .filter(user=self.request.user)
            .order_by("-date", "-created_at")
        )

        tx_type = self.request.query_params.get("type")
        category = self.request.query_params.get("category")
        month = self.request.query_params.get("month")

        if tx_type:
            queryset = queryset.filter(type=tx_type)
        if category:
            queryset = queryset.filter(category_id=category)
        if month:
            month_start = parse_month_string(month)
            if month_start:
                next_month = date(
                    month_start.year + (month_start.month // 12),
                    ((month_start.month % 12) + 1),
                    1,
                )
                queryset = queryset.filter(date__gte=month_start, date__lt=next_month)
        return queryset

    def list(self, request, *args, **kwargs):
        """List transactions for the current user."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serialized_page = self.get_serializer(page, many=True)
            data = {
                "count": self.paginator.page.paginator.count,
                "next": self.paginator.get_next_link(),
                "previous": self.paginator.get_previous_link(),
                "results": serialized_page.data,
            }
            return Response(
                build_response(True, data, TRANSACTION_LIST_MESSAGE),
                status=HTTPStatus.OK,
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(
            build_response(True, serializer.data, TRANSACTION_LIST_MESSAGE),
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        """Create a transaction with optional auto-categorization."""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, VALIDATION_FAILED_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        category = serializer.validated_data.get("category")
        if category is None:
            category = categorize_transaction(
                serializer.validated_data.get("description", ""), request.user
            )

        try:
            with transaction.atomic():
                transaction_obj = serializer.save(user=request.user, category=category)
                update_or_create_monthly_summary(request.user, transaction_obj.date)
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        output = self.get_serializer(transaction_obj).data
        return Response(
            build_response(True, output, TRANSACTION_CREATE_MESSAGE),
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single transaction."""
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                build_response(False, None, NOT_FOUND_MESSAGE),
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(instance)
        return Response(
            build_response(True, serializer.data, TRANSACTION_RETRIEVE_MESSAGE),
            status=status.HTTP_200_OK,
        )

    def update(self, request, *args, **kwargs):
        """Fully update an existing transaction."""
        partial = kwargs.pop("partial", False)
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                build_response(False, None, NOT_FOUND_MESSAGE),
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                build_response(False, serializer.errors, VALIDATION_FAILED_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        category = serializer.validated_data.get("category")
        if category is None:
            category = categorize_transaction(serializer.validated_data.get("description", ""), request.user)

        try:
            with transaction.atomic():
                transaction_obj = serializer.save(category=category)
                update_or_create_monthly_summary(request.user, transaction_obj.date)
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            build_response(True, self.get_serializer(transaction_obj).data, TRANSACTION_UPDATE_MESSAGE),
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a transaction."""
        try:
            instance = self.get_object()
        except Http404:
            return Response(
                build_response(False, None, NOT_FOUND_MESSAGE),
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            with transaction.atomic():
                target_date = instance.date
                instance.delete()
                update_or_create_monthly_summary(request.user, target_date)
        except DatabaseError:
            return Response(
                build_response(False, None, GENERIC_ERROR_MESSAGE),
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            build_response(True, None, TRANSACTION_DELETE_MESSAGE),
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Return monthly summary for the current or requested month."""
        month_input = request.query_params.get("month")
        month_date = parse_month_string(month_input) if month_input else date.today().replace(day=1)
        if not month_date:
            return Response(
                build_response(False, None, "Invalid month format. Use YYYY-MM."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary = update_or_create_monthly_summary(request.user, month_date)
        data = MonthlySummarySerializer(summary).data
        return Response(build_response(True, data, SUMMARY_MESSAGE), status=status.HTTP_200_OK)

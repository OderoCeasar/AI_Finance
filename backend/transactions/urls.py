"""URL routes for transactions and categories APIs."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from transactions.views import BudgetViewSet, CategoryListCreateAPIView, TransactionViewSet

router = DefaultRouter()
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"budgets", BudgetViewSet, basename="budget")

urlpatterns = [
    path("", include(router.urls)),
    path("categories/", CategoryListCreateAPIView.as_view(), name="category-list-create"),
]

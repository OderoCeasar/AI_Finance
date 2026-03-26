from django.contrib import admin
from django.urls import include, path

API_PREFIX = "api/"

urlpatterns = [
    path("admin/", admin.site.urls),
    path(f"{API_PREFIX}auth/", include("users.urls")),
    path(f"{API_PREFIX}", include("transactions.urls")),
    path(f"{API_PREFIX}analytics/", include("analytics.urls")),
    path(f"{API_PREFIX}predictions/", include("predictions.urls")),
    path(f"{API_PREFIX}recommendations/", include("recommendations.urls")),
    path(f"{API_PREFIX}integrations/mpesa/", include("mpesa.urls")),
]

from django.urls import path

from mpesa.views import (
    MpesaConfirmAPIView,
    MpesaConnectAPIView,
    MpesaDisconnectAPIView,
    MpesaImportAPIView,
    MpesaStatusAPIView,
)

urlpatterns = [
    path("status/", MpesaStatusAPIView.as_view(), name="mpesa-status"),
    path("connect/", MpesaConnectAPIView.as_view(), name="mpesa-connect"),
    path("confirm/", MpesaConfirmAPIView.as_view(), name="mpesa-confirm"),
    path("disconnect/", MpesaDisconnectAPIView.as_view(), name="mpesa-disconnect"),
    path("transactions/import/", MpesaImportAPIView.as_view(), name="mpesa-import"),
]

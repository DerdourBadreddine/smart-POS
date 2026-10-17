from django.urls import path

from devices.views import DeviceLookupView

urlpatterns = [
    path("devices/lookup/", DeviceLookupView.as_view(), name="device-lookup"),
]

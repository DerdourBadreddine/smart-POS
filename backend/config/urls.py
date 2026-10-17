"""Root URL configuration."""

from __future__ import annotations

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("catalog.urls")),
    path("api/", include("inventory.urls")),
    path("api/", include("customers.urls")),
    path("api/", include("shop.urls")),
    path("api/", include("sales.urls")),
    path("api/", include("repairs.urls")),
    path("api/", include("dashboard.urls")),
    path("api/", include("devices.urls")),
]

"""Root URL configuration."""

from __future__ import annotations

from django.contrib import admin
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import include, path, re_path

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


def frontend_index(request):
    index = Path(settings.FRONTEND_DIR) / "index.html"
    if not index.exists():
        raise Http404("Frontend build not found")
    return FileResponse(index.open("rb"), content_type="text/html")


if not settings.DEBUG:
    urlpatterns.append(
        re_path(r"^(?!api/|admin/|static/).*$", frontend_index, name="frontend")
    )

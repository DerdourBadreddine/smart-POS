"""Root URL configuration."""

from __future__ import annotations

import mimetypes

from django.contrib import admin
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import include, path, re_path

FRONTEND_MIME_TYPES = {
    ".json": "application/json",
    ".map": "application/json",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
}

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
    response = FileResponse(index.open("rb"), content_type="text/html")
    response["Cache-Control"] = "no-store"
    return response


def frontend_asset(request, path):
    frontend_root = Path(settings.FRONTEND_DIR).resolve()
    asset = (frontend_root / path).resolve()
    if frontend_root not in asset.parents:
        raise Http404("Frontend asset not found")
    if asset.is_file():
        content_type = FRONTEND_MIME_TYPES.get(asset.suffix.lower())
        if content_type is None:
            content_type, _ = mimetypes.guess_type(asset.name)
        response = FileResponse(
            asset.open("rb"),
            content_type=content_type or "application/octet-stream",
        )
        response["Cache-Control"] = "no-cache"
        return response
    if Path(path).suffix:
        raise Http404("Frontend asset not found")
    return frontend_index(request)


urlpatterns.append(
    re_path(
        r"^(?!api/|admin/|static/)(?P<path>.+)$",
        frontend_asset,
        name="frontend-asset",
    )
)

if not settings.DEBUG:
    urlpatterns.append(
        re_path(r"^(?!api/|admin/|static/).*$", frontend_index, name="frontend")
    )

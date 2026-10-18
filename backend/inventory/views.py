from __future__ import annotations

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import AllowAny

from inventory.models import PhoneUnit, StockMovement
from inventory.serializers import PhoneUnitSerializer, StockMovementSerializer


class PhoneUnitViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]
    queryset = PhoneUnit.objects.select_related("product").all()
    serializer_class = PhoneUnitSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["imei", "product__name", "product__sku"]
    filterset_fields = ["status", "product"]


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related("product", "phone_unit").all()
    serializer_class = StockMovementSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["product__name", "reference", "note"]
    filterset_fields = ["product", "phone_unit", "reason"]

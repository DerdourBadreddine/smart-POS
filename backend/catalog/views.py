from __future__ import annotations

import csv
import io
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from catalog.models import Category, Product
from catalog.serializers import CategorySerializer, ProductLookupSerializer, ProductSerializer
from inventory.services import adjust_stock


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name"]
    filterset_fields = ["kind"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "sku", "brand", "model_name"]
    ordering_fields = ["name", "sku", "stock_qty", "sell_price", "created_at"]
    filterset_fields = ["category", "category__kind", "is_active"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("low_stock", "").lower() == "true":
            queryset = queryset.filter(stock_qty__lte=models.F("low_stock_threshold"))
        return queryset

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])
        exact_unit = (
            Product.objects.filter(phone_units__imei=query, phone_units__status="IN_STOCK")
            .select_related("category")
            .distinct()
        )
        matches = list(exact_unit)
        for product in matches:
            unit = product.phone_units.get(imei=query, status="IN_STOCK")
            product.matched_phone_unit_id = unit.id
            product.matched_imei = unit.imei
        remaining = Product.objects.filter(is_active=True).select_related("category")
        if query:
            remaining = remaining.filter(
                models.Q(name__icontains=query)
                | models.Q(sku__icontains=query)
                | models.Q(brand__icontains=query)
                | models.Q(model_name__icontains=query)
            )
        seen = {product.pk for product in matches}
        matches.extend(product for product in remaining if product.pk not in seen)
        return Response(ProductLookupSerializer(matches[:10], many=True).data)

    @action(detail=True, methods=["post"], url_path="adjust-stock")
    def adjust_stock_action(self, request, pk=None):
        product = self.get_object()
        class AdjustmentSerializer(serializers.Serializer):
            delta = serializers.IntegerField()
            reason = serializers.CharField(required=False, default="ADJUSTMENT")
            note = serializers.CharField(required=False, allow_blank=True, default="")

        serializer = AdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            product = adjust_stock(product=product, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductSerializer(product).data)

    @action(detail=False, methods=["post"], url_path="import-csv")
    def import_csv(self, request):
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"detail": _("CSV file is required.")}, status=status.HTTP_400_BAD_REQUEST)
        try:
            content = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response({"detail": _("CSV must be UTF-8 encoded.")}, status=status.HTTP_400_BAD_REQUEST)

        delimiter = ";" if content.splitlines() and content.splitlines()[0].count(";") > content.splitlines()[0].count(",") else ","
        rows = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        required = {"sku", "name", "category", "cost_price", "sell_price"}
        if not required.issubset(set(rows.fieldnames or [])):
            return Response({"detail": _("CSV is missing required columns.")}, status=status.HTTP_400_BAD_REQUEST)

        dry_run = request.query_params.get("dry_run", "").lower() == "true"
        result = {"created": 0, "updated": 0, "errors": []}
        with transaction.atomic():
            for line_number, row in enumerate(rows, start=2):
                try:
                    category, _ = Category.objects.get_or_create(
                        name=row["category"].strip(),
                        defaults={"kind": Category.Kind.ACCESSORY},
                    )
                    defaults = {
                        "name": row["name"].strip(),
                        "category": category,
                        "brand": row.get("brand", "").strip(),
                        "model_name": row.get("model_name", "").strip(),
                        "cost_price": Decimal(row["cost_price"]),
                        "sell_price": Decimal(row["sell_price"]),
                        "stock_qty": int(row.get("stock_qty") or 0),
                        "low_stock_threshold": int(row.get("low_stock_threshold") or 2),
                        "warranty_days": int(row.get("warranty_days") or 0),
                    }
                    _, created = Product.objects.update_or_create(sku=row["sku"].strip(), defaults=defaults)
                    result["created" if created else "updated"] += 1
                except (KeyError, InvalidOperation, TypeError, ValueError) as exc:
                    result["errors"].append({"line": line_number, "error": str(exc)})
            if result["errors"] or dry_run:
                transaction.set_rollback(True)
        return Response(result)

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="products.csv"'
        response.write("\ufeff")
        writer = csv.writer(response)
        writer.writerow(["sku", "name", "category", "brand", "model_name", "cost_price", "sell_price", "stock_qty", "low_stock_threshold", "warranty_days"])
        for product in queryset:
            writer.writerow([
                product.sku,
                product.name,
                product.category.name,
                product.brand,
                product.model_name,
                product.cost_price,
                product.sell_price,
                product.stock_qty,
                product.low_stock_threshold,
                product.warranty_days,
            ])
        return response

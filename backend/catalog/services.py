from __future__ import annotations

import csv
import io
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from catalog.models import Category, Product
from inventory.services import adjust_stock


@transaction.atomic
def save_product(*, data: dict, product: Product | None = None) -> Product:
    data = dict(data)
    product = Product.objects.select_for_update().get(pk=product.pk) if product else Product()
    target_stock = data.pop("stock_qty", product.stock_qty)
    tracking = data.get("track_imei", product.track_imei)
    if product.pk and tracking != product.track_imei and (product.stock_qty or product.phone_units.exists()):
        raise ValidationError(_("Stock tracking cannot change while units exist."))
    if tracking and target_stock != product.stock_qty:
        raise ValidationError(_("IMEI-tracked products must be received one unit at a time."))
    if target_stock < 0:
        raise ValidationError(_("Stock cannot become negative."))
    for field, value in data.items():
        setattr(product, field, value)
    for field in ("cost_price", "sell_price", "low_stock_threshold", "warranty_days"):
        if getattr(product, field) < 0:
            raise ValidationError(_("Values cannot be negative."))
    product.full_clean()
    product.save()
    delta = target_stock - product.stock_qty
    if delta:
        product = adjust_stock(product=product, delta=delta)
    return product


@transaction.atomic
def import_catalog(*, content: str, dry_run: bool) -> dict:
    first = content.splitlines()[0] if content.splitlines() else ""
    rows = csv.DictReader(io.StringIO(content), delimiter=";" if first.count(";") > first.count(",") else ",")
    if not {"sku", "name", "category", "cost_price", "sell_price"}.issubset(set(rows.fieldnames or [])):
        raise ValidationError(_("CSV is missing required columns."))
    result = {"created": 0, "updated": 0, "errors": []}
    for line, row in enumerate(rows, 2):
        try:
            with transaction.atomic():
                category, _created = Category.objects.get_or_create(name=row["category"].strip(), defaults={"kind": Category.Kind.ACCESSORY})
                product = Product.objects.filter(sku=row["sku"].strip()).first()
                data = {"sku": row["sku"].strip(), "name": row["name"].strip(), "category": category,
                        "brand": (row.get("brand") or "").strip(), "model_name": (row.get("model_name") or "").strip()}
                for field in ("cost_price", "sell_price"):
                    value = Decimal(row[field])
                    if not value.is_finite():
                        raise ValidationError(_("Invalid money amount."))
                    data[field] = value
                for field, default in (("stock_qty", 0), ("low_stock_threshold", 2), ("warranty_days", 0)):
                    data[field] = int(row.get(field) or default)
                save_product(data=data, product=product)
                result["updated" if product else "created"] += 1
        except (ValidationError, InvalidOperation, TypeError, ValueError, KeyError) as exc:
            result["errors"].append({"line": line, "error": "; ".join(exc.messages) if isinstance(exc, ValidationError) else str(_("Invalid CSV row."))})
    if dry_run or result["errors"]:
        transaction.set_rollback(True)
    return result

from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from catalog.models import Product
from inventory.models import PhoneUnit, StockMovement


@transaction.atomic
def receive_phone(
    *,
    product: Product,
    imei: str,
    condition: str,
    cost_price: Decimal,
    sell_price: Decimal,
    supplier: str = "",
    purchased_at: date | None = None,
    notes: str = "",
) -> PhoneUnit:
    product = Product.objects.select_for_update().get(pk=product.pk)
    if not product.track_imei:
        raise ValidationError(_("Only IMEI-tracked products can receive phone units."))
    if PhoneUnit.objects.filter(imei=imei).exists():
        raise ValidationError(_("A phone unit with this IMEI already exists."))

    unit = PhoneUnit(
        product=product,
        imei=imei,
        condition=condition,
        cost_price=cost_price,
        sell_price=sell_price,
        purchased_at=purchased_at or date.today(),
        supplier=supplier,
        notes=notes,
    )
    unit.full_clean()
    unit.save()
    product.stock_qty += 1
    product.save(update_fields=["stock_qty", "updated_at"])
    StockMovement.objects.create(
        product=product,
        phone_unit=unit,
        quantity_change=1,
        reason=StockMovement.Reason.PURCHASE,
        reference=unit.imei,
    )
    return unit


@transaction.atomic
def adjust_stock(
    *,
    product: Product,
    delta: int,
    reason: str = StockMovement.Reason.ADJUSTMENT,
    note: str = "",
) -> Product:
    product = Product.objects.select_for_update().get(pk=product.pk)
    if product.track_imei:
        raise ValidationError(_("IMEI-tracked products must be received one unit at a time."))
    if delta == 0:
        raise ValidationError(_("Stock adjustment cannot be zero."))
    if product.stock_qty + delta < 0:
        raise ValidationError(_("Stock cannot become negative."))
    valid_reasons = {choice.value for choice in StockMovement.Reason}
    if reason not in valid_reasons:
        raise ValidationError(_("Invalid stock movement reason."))

    product.stock_qty += delta
    product.save(update_fields=["stock_qty", "updated_at"])
    StockMovement.objects.create(
        product=product,
        quantity_change=delta,
        reason=reason,
        reference=product.sku,
        note=note,
    )
    return product

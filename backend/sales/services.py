from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from catalog.models import Product
from inventory.models import PhoneUnit, StockMovement
from sales.models import Sale, SaleItem, SalePayment


def _next_number(prefix: str, current_date) -> str:
    latest = (
        Sale.objects.filter(number__startswith=f"{prefix}-{current_date:%Y%m%d}-")
        .aggregate(last=Max("number"))["last"]
    )
    sequence = int(latest.rsplit("-", 1)[-1]) + 1 if latest else 1
    return f"{prefix}-{current_date:%Y%m%d}-{sequence:03d}"


@transaction.atomic
def create_sale(
    *,
    items: list[dict],
    customer_id: int | None = None,
    discount: Decimal = Decimal("0.00"),
    payment_method: str = Sale.PaymentMethod.CASH,
    amount_paid: Decimal = Decimal("0.00"),
) -> Sale:
    if not items:
        raise ValidationError(_("A sale must contain at least one item."))
    discount = Decimal(discount)
    amount_paid = Decimal(amount_paid)
    if discount < 0:
        raise ValidationError(_("Discount cannot be negative."))

    sale = Sale(
        number=_next_number("S", timezone.localdate()),
        customer_id=customer_id,
        subtotal=Decimal("0.00"),
        discount=discount,
        total=Decimal("0.00"),
        payment_method=payment_method,
        amount_paid=amount_paid,
    )
    if customer_id is not None:
        from customers.models import Customer

        if not Customer.objects.filter(pk=customer_id).exists():
            raise ValidationError(_("The selected customer does not exist."))

    sale_items: list[SaleItem] = []
    subtotal = Decimal("0.00")
    requested: dict[int, int] = {}
    seen_units: set[int] = set()
    for item in items:
        try:
            quantity = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            raise ValidationError(_("Item quantity must be positive."))
        if str(quantity) != str(item.get("quantity", 1)):
            raise ValidationError(_("Item quantity must be positive."))
        if quantity < 1:
            raise ValidationError(_("Item quantity must be positive."))
        phone_unit_id = item.get("phone_unit_id")
        product_id = item.get("product_id")
        if phone_unit_id is not None:
            if phone_unit_id in seen_units:
                raise ValidationError(_("The selected phone unit is not in stock."))
            seen_units.add(phone_unit_id)
            if quantity != 1:
                raise ValidationError(_("A phone unit sale must have quantity one."))
            unit = (
                PhoneUnit.objects.select_for_update()
                .select_related("product")
                .filter(pk=phone_unit_id)
                .first()
            )
            if unit is None or unit.status != PhoneUnit.Status.IN_STOCK:
                raise ValidationError(_("The selected phone unit is not in stock."))
            product = unit.product
            unit_price = Decimal(item.get("unit_price", unit.sell_price))
            unit_cost = unit.cost_price
            phone_unit = unit
        elif product_id is not None:
            product = Product.objects.select_for_update().filter(pk=product_id).first()
            if product is None:
                raise ValidationError(_("The selected product does not exist."))
            if product.track_imei:
                raise ValidationError(_("This product must be sold by phone unit."))
            if product.stock_qty < quantity:
                raise ValidationError(_("Insufficient stock for %(product)s.") % {"product": product.name})
            unit_price = Decimal(item.get("unit_price", product.sell_price))
            unit_cost = product.cost_price
            phone_unit = None
        else:
            raise ValidationError(_("Each sale item needs a product or phone unit."))

        if not product.is_active:
            raise ValidationError(_("The selected product is inactive."))
        requested[product.pk] = requested.get(product.pk, 0) + quantity
        if requested[product.pk] > product.stock_qty:
            raise ValidationError(_("Insufficient stock for %(product)s.") % {"product": product.name})
        if not unit_price.is_finite() or unit_price < 0:
            raise ValidationError(_("Unit price cannot be negative."))
        line_total = unit_price * quantity
        sale_items.append(
            SaleItem(
                sale=sale,
                product=product,
                phone_unit=phone_unit,
                description=product.name,
                quantity=quantity,
                unit_price=unit_price,
                unit_cost=unit_cost,
                line_total=line_total,
                warranty_until=(
                    timezone.localdate() + timedelta(days=product.warranty_days)
                    if product.warranty_days > 0
                    else None
                ),
            )
        )
        subtotal += line_total

    if discount > subtotal:
        raise ValidationError(_("Discount cannot exceed the subtotal."))
    total = subtotal - discount
    if amount_paid < 0 or amount_paid > total:
        raise ValidationError(_("Amount paid must be between zero and the sale total."))
    if amount_paid < total and customer_id is None:
        raise ValidationError(_("A customer is required for a credit sale."))

    sale.subtotal = subtotal
    sale.total = total
    sale.save()
    SaleItem.objects.bulk_create(sale_items)
    for sale_item in sale_items:
        product = Product.objects.select_for_update().get(pk=sale_item.product_id)
        product.stock_qty -= sale_item.quantity
        product.save(update_fields=["stock_qty", "updated_at"])
        if sale_item.phone_unit_id:
            PhoneUnit.objects.filter(pk=sale_item.phone_unit_id).update(status=PhoneUnit.Status.SOLD)
        StockMovement.objects.create(
            product=product,
            phone_unit_id=sale_item.phone_unit_id,
            quantity_change=-sale_item.quantity,
            reason=StockMovement.Reason.SALE,
            reference=sale.number,
        )
    return sale


@transaction.atomic
def void_sale(sale: Sale) -> Sale:
    sale = Sale.objects.select_for_update().prefetch_related("items").get(pk=sale.pk)
    if sale.status != Sale.Status.COMPLETED:
        raise ValidationError(_("Only completed sales can be voided."))
    for item in sale.items.all():
        product = Product.objects.select_for_update().get(pk=item.product_id)
        product.stock_qty += item.quantity
        product.save(update_fields=["stock_qty", "updated_at"])
        if item.phone_unit_id:
            PhoneUnit.objects.filter(pk=item.phone_unit_id).update(status=PhoneUnit.Status.IN_STOCK)
        StockMovement.objects.create(
            product=product,
            phone_unit_id=item.phone_unit_id,
            quantity_change=item.quantity,
            reason=StockMovement.Reason.VOID,
            reference=sale.number,
        )
    sale.status = Sale.Status.VOIDED
    sale.save(update_fields=["status", "updated_at"])
    return sale


@transaction.atomic
def record_payment(*, sale: Sale, amount: Decimal, method: str, note: str = "") -> SalePayment:
    sale = Sale.objects.select_for_update().get(pk=sale.pk)
    amount = Decimal(amount)
    if sale.status != Sale.Status.COMPLETED:
        raise ValidationError(_("Payments can only be added to completed sales."))
    if amount <= 0:
        raise ValidationError(_("Payment amount must be positive."))
    if amount > sale.balance:
        raise ValidationError(_("Payment cannot exceed the remaining balance."))
    return SalePayment.objects.create(sale=sale, amount=amount, method=method, note=note)

from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from catalog.models import Product
from inventory.models import StockMovement
from repairs.models import RepairPart, RepairTicket


def _next_number(current_date: date) -> str:
    latest = (
        RepairTicket.objects.filter(number__startswith=f"R-{current_date:%Y%m%d}-")
        .aggregate(last=Max("number"))["last"]
    )
    sequence = int(latest.rsplit("-", 1)[-1]) + 1 if latest else 1
    return f"R-{current_date:%Y%m%d}-{sequence:03d}"


@transaction.atomic
def create_ticket(*, data: dict) -> RepairTicket:
    deposit = Decimal(data.pop("deposit_paid", 0))
    if deposit < 0:
        raise ValidationError(_("Deposit cannot be negative."))
    ticket = RepairTicket.objects.create(
        number=_next_number(timezone.localdate()),
        amount_paid=deposit,
        **data,
    )
    if ticket.amount_paid > ticket.total:
        raise ValidationError(_("Deposit cannot exceed the repair total."))
    return ticket


@transaction.atomic
def change_status(*, ticket: RepairTicket, new_status: str) -> RepairTicket:
    ticket = RepairTicket.objects.select_for_update().get(pk=ticket.pk)
    if ticket.status in {RepairTicket.Status.CANCELLED, RepairTicket.Status.DELIVERED}:
        raise ValidationError(_("This ticket cannot change status again."))
    if new_status not in RepairTicket.Status.values:
        raise ValidationError(_("Invalid repair status."))
    if new_status == RepairTicket.Status.DELIVERED and ticket.balance > 0:
        raise ValidationError(_("The repair balance must be zero before delivery."))
    now = timezone.now()
    ticket.status = new_status
    if new_status == RepairTicket.Status.READY and ticket.completed_at is None:
        ticket.completed_at = now
    if new_status == RepairTicket.Status.DELIVERED:
        ticket.delivered_at = now
    ticket.save(update_fields=["status", "completed_at", "delivered_at", "updated_at"])
    return ticket


@transaction.atomic
def add_part(
    *,
    ticket: RepairTicket,
    product_id: int,
    quantity: int,
    unit_price: Decimal | None = None,
) -> RepairPart:
    if quantity < 1:
        raise ValidationError(_("Part quantity must be positive."))
    product = Product.objects.select_for_update().get(pk=product_id)
    if product.track_imei:
        raise ValidationError(_("IMEI-tracked products cannot be used as repair parts."))
    if product.stock_qty < quantity:
        raise ValidationError(_("Insufficient stock for %(product)s.") % {"product": product.name})
    part = RepairPart.objects.create(
        ticket=ticket,
        product=product,
        quantity=quantity,
        unit_price=Decimal(unit_price if unit_price is not None else product.sell_price),
        unit_cost=product.cost_price,
    )
    product.stock_qty -= quantity
    product.save(update_fields=["stock_qty", "updated_at"])
    StockMovement.objects.create(
        product=product,
        quantity_change=-quantity,
        reason=StockMovement.Reason.REPAIR_USE,
        reference=ticket.number,
    )
    return part


@transaction.atomic
def remove_part(*, ticket: RepairTicket, part_id: int) -> None:
    part = RepairPart.objects.select_for_update().filter(pk=part_id, ticket=ticket).first()
    if part is None:
        raise ValidationError(_("Repair part was not found."))
    product = Product.objects.select_for_update().get(pk=part.product_id)
    product.stock_qty += part.quantity
    product.save(update_fields=["stock_qty", "updated_at"])
    StockMovement.objects.create(
        product=product,
        quantity_change=part.quantity,
        reason=StockMovement.Reason.RETURN,
        reference=ticket.number,
    )
    part.delete()


@transaction.atomic
def record_payment(*, ticket: RepairTicket, amount: Decimal) -> RepairTicket:
    ticket = RepairTicket.objects.select_for_update().get(pk=ticket.pk)
    amount = Decimal(amount)
    if amount <= 0:
        raise ValidationError(_("Payment amount must be positive."))
    if amount > ticket.balance:
        raise ValidationError(_("Payment cannot exceed the remaining balance."))
    ticket.amount_paid += amount
    ticket.save(update_fields=["amount_paid", "updated_at"])
    return ticket

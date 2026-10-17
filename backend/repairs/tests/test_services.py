from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from catalog.models import Category, Product
from customers.models import Customer
from inventory.models import StockMovement
from repairs.models import RepairTicket
from repairs.services import add_part, change_status, create_ticket, record_payment, remove_part


@pytest.fixture
def repair_setup():
    category = Category.objects.create(name="Repair parts", kind=Category.Kind.PART)
    product = Product.objects.create(
        name="Repair screen",
        sku="REPAIR-SCREEN",
        category=category,
        cost_price=Decimal("30.00"),
        sell_price=Decimal("50.00"),
        stock_qty=2,
    )
    customer = Customer.objects.create(name="Repair customer", phone="123")
    ticket = create_ticket(
        data={
            "customer": customer,
            "device_brand": "Test",
            "device_model": "Device",
            "imei": "",
            "issue_description": "Broken screen",
            "labor_cost": Decimal("20.00"),
            "estimated_cost": Decimal("80.00"),
            "warranty_days": 30,
        }
    )
    return product, ticket


@pytest.mark.django_db
def test_add_and_remove_part_updates_stock_and_ledger(repair_setup):
    product, ticket = repair_setup

    part = add_part(ticket=ticket, product_id=product.id, quantity=1)
    product.refresh_from_db()
    assert product.stock_qty == 1
    assert ticket.parts_total == Decimal("50.00")
    assert StockMovement.objects.filter(reference=ticket.number).count() == 1

    remove_part(ticket=ticket, part_id=part.id)
    product.refresh_from_db()
    assert product.stock_qty == 2
    assert ticket.parts.count() == 0


@pytest.mark.django_db
def test_delivery_requires_zero_balance_and_sets_timestamp(repair_setup):
    _, ticket = repair_setup

    with pytest.raises(ValidationError):
        change_status(ticket=ticket, new_status=RepairTicket.Status.DELIVERED)

    record_payment(ticket=ticket, amount=Decimal("20.00"))
    ticket = change_status(ticket=ticket, new_status=RepairTicket.Status.READY)
    assert ticket.completed_at is not None
    ticket = change_status(ticket=ticket, new_status=RepairTicket.Status.DELIVERED)
    assert ticket.delivered_at is not None


@pytest.mark.django_db
def test_payment_cannot_exceed_balance(repair_setup):
    _, ticket = repair_setup

    with pytest.raises(ValidationError):
        record_payment(ticket=ticket, amount=Decimal("21.00"))

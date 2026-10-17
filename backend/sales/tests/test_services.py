from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from catalog.models import Category, Product
from inventory.models import PhoneUnit, StockMovement
from sales.models import Sale
from sales.services import create_sale, void_sale


@pytest.fixture
def products():
    accessory_category = Category.objects.create(name="Sale accessories", kind=Category.Kind.ACCESSORY)
    phone_category = Category.objects.create(name="Sale phones", kind=Category.Kind.PHONE)
    accessory = Product.objects.create(
        name="Sale cable",
        sku="SALE-CABLE",
        category=accessory_category,
        cost_price=Decimal("10.00"),
        sell_price=Decimal("20.00"),
        stock_qty=3,
    )
    phone = Product.objects.create(
        name="Sale phone",
        sku="SALE-PHONE",
        category=phone_category,
        cost_price=Decimal("100.00"),
        sell_price=Decimal("150.00"),
        track_imei=True,
        warranty_days=30,
        stock_qty=1,
    )
    unit = PhoneUnit.objects.create(
        product=phone,
        imei="352099001234569",
        condition=PhoneUnit.Condition.NEW,
        cost_price=Decimal("100.00"),
        sell_price=Decimal("150.00"),
        purchased_at="2026-10-17",
    )
    return accessory, phone, unit


@pytest.mark.django_db
def test_create_sale_decrements_stock_and_snapshots_items(products):
    accessory, phone, unit = products

    sale = create_sale(
        items=[
            {"product_id": accessory.id, "quantity": 2},
            {"phone_unit_id": unit.id},
        ],
        customer_id=None,
        payment_method=Sale.PaymentMethod.CASH,
        amount_paid=Decimal("190.00"),
    )

    accessory.refresh_from_db()
    phone.refresh_from_db()
    unit.refresh_from_db()
    assert sale.total == Decimal("190.00")
    assert accessory.stock_qty == 1
    assert phone.stock_qty == 0
    assert unit.status == PhoneUnit.Status.SOLD
    assert Sale.objects.get(pk=sale.pk).items.count() == 2
    assert StockMovement.objects.filter(reference=sale.number, reason=StockMovement.Reason.SALE).count() == 2


@pytest.mark.django_db
def test_credit_sale_requires_customer(products):
    accessory, _, _ = products

    with pytest.raises(ValidationError):
        create_sale(
            items=[{"product_id": accessory.id, "quantity": 1}],
            customer_id=None,
            payment_method=Sale.PaymentMethod.CASH,
            amount_paid=Decimal("0.00"),
        )


@pytest.mark.django_db
def test_void_sale_restores_stock_and_rejects_second_void(products):
    accessory, _, _ = products
    sale = create_sale(
        items=[{"product_id": accessory.id, "quantity": 1}],
        customer_id=None,
        payment_method=Sale.PaymentMethod.CASH,
        amount_paid=Decimal("20.00"),
    )

    void_sale(sale)
    accessory.refresh_from_db()
    assert accessory.stock_qty == 3
    assert sale.__class__.objects.get(pk=sale.pk).status == Sale.Status.VOIDED

    with pytest.raises(ValidationError):
        void_sale(sale)

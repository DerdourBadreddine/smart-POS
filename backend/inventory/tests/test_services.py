from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from catalog.models import Category, Product
from inventory.models import PhoneUnit, StockMovement
from inventory.services import adjust_stock, receive_phone


@pytest.fixture
def accessory():
    category = Category.objects.create(name="Test accessories", kind=Category.Kind.ACCESSORY)
    return Product.objects.create(
        name="Test cable",
        sku="TEST-CABLE",
        category=category,
        cost_price=Decimal("10.00"),
        sell_price=Decimal("20.00"),
    )


@pytest.fixture
def phone():
    category = Category.objects.create(name="Test phones", kind=Category.Kind.PHONE)
    return Product.objects.create(
        name="Test phone",
        sku="TEST-PHONE",
        category=category,
        cost_price=Decimal("100.00"),
        sell_price=Decimal("150.00"),
        track_imei=True,
    )


@pytest.mark.django_db
def test_adjust_stock_updates_product_and_ledger(accessory):
    result = adjust_stock(product=accessory, delta=4, note="opening stock")

    accessory.refresh_from_db()
    assert result.stock_qty == 4
    assert accessory.stock_qty == 4
    assert StockMovement.objects.get(product=accessory).quantity_change == 4


@pytest.mark.django_db
def test_adjust_stock_rejects_imei_products(phone):
    with pytest.raises(ValidationError):
        adjust_stock(product=phone, delta=1)


@pytest.mark.django_db
def test_receive_phone_creates_unit_and_movement(phone):
    unit = receive_phone(
        product=phone,
        imei="490154203237518",
        condition=PhoneUnit.Condition.NEW,
        cost_price=Decimal("100.00"),
        sell_price=Decimal("150.00"),
        purchased_at=date(2026, 10, 17),
    )

    phone.refresh_from_db()
    assert unit.status == PhoneUnit.Status.IN_STOCK
    assert phone.stock_qty == 1
    assert StockMovement.objects.get(phone_unit=unit).reason == StockMovement.Reason.PURCHASE

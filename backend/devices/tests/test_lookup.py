from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from catalog.models import Category, Product
from inventory.models import PhoneUnit
from sales.services import create_sale


@pytest.mark.django_db
def test_device_lookup_returns_sale_and_warranty():
    category = Category.objects.create(name="Lookup devices", kind=Category.Kind.PHONE)
    product = Product.objects.create(
        name="Lookup device",
        sku="LOOKUP-DEVICE",
        category=category,
        cost_price=Decimal("100.00"),
        sell_price=Decimal("150.00"),
        track_imei=True,
        warranty_days=30,
        stock_qty=1,
    )
    unit = PhoneUnit.objects.create(
        product=product,
        imei="352099001234569",
        condition=PhoneUnit.Condition.NEW,
        cost_price=Decimal("100.00"),
        sell_price=Decimal("150.00"),
        purchased_at="2026-10-17",
    )
    sale = create_sale(
        items=[{"phone_unit_id": unit.id}],
        customer_id=None,
        payment_method="CASH",
        amount_paid=Decimal("150.00"),
    )

    response = APIClient().get("/api/devices/lookup/?imei=352099001234569")

    assert response.status_code == 200
    assert response.data["sales"][0]["number"] == sale.number
    assert response.data["warranty"]["active"] is True

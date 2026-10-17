from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from catalog.models import Category, Product
from inventory.models import PhoneUnit


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_product_lookup_returns_matching_product(api_client):
    category = Category.objects.create(name="Lookup phones", kind=Category.Kind.PHONE)
    product = Product.objects.create(
        name="Lookup phone",
        sku="LOOKUP-PHONE",
        category=category,
        cost_price=Decimal("10.00"),
        sell_price=Decimal("20.00"),
        track_imei=True,
        stock_qty=1,
    )
    PhoneUnit.objects.create(
        product=product,
        imei="352099001234569",
        condition=PhoneUnit.Condition.NEW,
        cost_price=Decimal("10.00"),
        sell_price=Decimal("20.00"),
        purchased_at="2026-10-17",
    )

    response = api_client.get("/api/products/lookup/?q=352099001234569")

    assert response.status_code == 200
    assert response.data[0]["id"] == product.id


@pytest.mark.django_db
def test_low_stock_filter(api_client):
    category = Category.objects.create(name="Low stock accessories", kind=Category.Kind.ACCESSORY)
    product = Product.objects.create(
        name="Low stock item",
        sku="LOW-ITEM",
        category=category,
        cost_price=Decimal("10.00"),
        sell_price=Decimal("20.00"),
        stock_qty=1,
        low_stock_threshold=2,
    )

    response = api_client.get("/api/products/?low_stock=true")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == product.id

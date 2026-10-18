from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from catalog.models import Category, Product
from customers.models import Customer
from inventory.models import PhoneUnit, StockMovement
from inventory.services import receive_phone
from sales.models import Sale
from sales.services import create_sale


@pytest.fixture
def stock():
    category = Category.objects.create(name='Regression', kind='ACCESSORY')
    product = Product.objects.create(category=category, sku='REG', name='Cable', stock_qty=3, cost_price='1.00', sell_price='10.00')
    return product


@pytest.mark.django_db
def test_repeated_lines_cannot_oversell_and_rollback(stock):
    with pytest.raises(ValidationError):
        create_sale(items=[{'product_id': stock.pk, 'quantity': 2}] * 2, customer_id=None, amount_paid=Decimal('40'))
    stock.refresh_from_db()
    assert stock.stock_qty == 3
    assert not Sale.objects.exists()
    assert not StockMovement.objects.exists()


@pytest.mark.django_db
def test_duplicate_phone_is_rejected_atomically(stock):
    stock.track_imei = True
    stock.stock_qty = 0
    stock.save()
    unit = receive_phone(product=stock, imei='490154203237518', condition='NEW', cost_price=Decimal('1'), sell_price=Decimal('10'))
    with pytest.raises(ValidationError):
        create_sale(items=[{'phone_unit_id': unit.pk}] * 2, customer_id=None, amount_paid=Decimal('20'))
    unit.refresh_from_db()
    assert unit.status == PhoneUnit.Status.IN_STOCK


@pytest.mark.django_db
def test_oldest_first_collection_is_atomic(stock):
    client = APIClient()
    customer = Customer.objects.create(name='Credit customer')
    first = create_sale(items=[{'product_id': stock.pk}], customer_id=customer.pk)
    second = create_sale(items=[{'product_id': stock.pk}], customer_id=customer.pk)
    response = client.post(f'/api/customers/{customer.pk}/collect/', {'amount': '15.00', 'method': 'CASH'}, format='json')
    assert response.status_code == 200
    assert Sale.objects.get(pk=first.pk).balance == Decimal('0')
    assert Sale.objects.get(pk=second.pk).balance == Decimal('5')
    response = client.post(f'/api/customers/{customer.pk}/collect/', {'amount': '6.00', 'method': 'CASH'}, format='json')
    assert response.status_code == 400
    assert Sale.objects.get(pk=second.pk).balance == Decimal('5')


@pytest.mark.django_db
def test_sale_cannot_be_mutated_or_deleted(stock):
    sale = create_sale(items=[{'product_id': stock.pk}], customer_id=None, amount_paid=Decimal('10'))
    client = APIClient()
    assert client.patch(f'/api/sales/{sale.pk}/', {'total': '0'}, format='json').status_code == 405
    assert client.delete(f'/api/sales/{sale.pk}/').status_code == 405


@pytest.mark.django_db
def test_invalid_item_returns_validation_error(stock):
    client = APIClient()
    for item in [{'product_id': 999999}, {'product_id': stock.pk, 'quantity': 'bad'}, {'product_id': stock.pk, 'unit_price': 'NaN'}]:
        response = client.post('/api/sales/', {'items': [item], 'payment_method': 'CASH', 'amount_paid': '0'}, format='json')
        assert response.status_code == 400

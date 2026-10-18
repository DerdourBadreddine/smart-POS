from decimal import Decimal
import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from catalog.models import Category, Product
from customers.models import Customer
from repairs.services import create_ticket, add_part, change_status, record_payment


@pytest.mark.django_db
def test_deposit_persisted_and_parts_removed_through_api():
    customer=Customer.objects.create(name='Test')
    ticket=create_ticket(data={'customer':customer,'device_brand':'Test','device_model':'Phone','issue_description':'Broken','labor_cost':Decimal('30'),'deposit_paid':Decimal('10')})
    assert ticket.deposit_paid == Decimal('10')
    assert ticket.amount_paid == Decimal('10')
    category=Category.objects.create(name='Parts',kind='PART')
    product=Product.objects.create(category=category,name='Screen',sku='SCREEN',stock_qty=2,cost_price='5',sell_price='10')
    part=add_part(ticket=ticket,product_id=product.pk,quantity=1)
    response=APIClient().delete(f'/api/repairs/{ticket.pk}/parts/{part.pk}/')
    assert response.status_code == 204
    product.refresh_from_db()
    assert product.stock_qty == 2
    assert APIClient().delete(f'/api/repairs/{ticket.pk}/').status_code == 405
    record_payment(ticket=ticket,amount=Decimal('20'))
    ticket=change_status(ticket=ticket,new_status='DELIVERED')
    with pytest.raises(ValidationError):
        add_part(ticket=ticket,product_id=product.pk,quantity=1)


@pytest.mark.django_db
def test_update_cannot_bypass_delivery_rule_or_create_negative_balance():
    customer=Customer.objects.create(name='Test')
    ticket=create_ticket(data={'customer':customer,'device_brand':'Test','device_model':'Phone','issue_description':'Broken','labor_cost':Decimal('30'),'deposit_paid':Decimal('10')})
    client=APIClient()
    response=client.patch(f'/api/repairs/{ticket.pk}/',{'status':'DELIVERED','amount_paid':'30'},format='json')
    assert response.data['status'] == 'RECEIVED'
    assert response.data['amount_paid'] == '10.00'
    assert client.patch(f'/api/repairs/{ticket.pk}/',{'labor_cost':'5'},format='json').status_code == 400

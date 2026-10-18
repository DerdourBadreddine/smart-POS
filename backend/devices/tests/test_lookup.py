from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from catalog.models import Category, Product
from inventory.models import PhoneUnit
from sales.services import create_sale
from customers.models import Customer
from repairs.models import RepairTicket
from django.utils import timezone
from datetime import timedelta


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


@pytest.mark.django_db
@pytest.mark.parametrize('age,active', [(1,True),(60,False)])
def test_repaired_imei_active_and_expired_warranty(age,active):
    customer=Customer.objects.create(name='Repair warranty')
    RepairTicket.objects.create(number=f'R-WARRANTY-{age}',customer=customer,device_brand='Test',device_model='Phone',issue_description='Broken',imei='490154203237518',status='DELIVERED',delivered_at=timezone.now()-timedelta(days=age),warranty_days=30)
    response=APIClient().get('/api/devices/lookup/?imei=490154203237518')
    assert response.data['warranty']['active'] is active
    assert response.data['warranty']['source']=='repair'
    assert len(response.data['repairs'])==1


@pytest.mark.django_db
def test_unknown_imei_has_no_warranty_or_history():
    response=APIClient().get('/api/devices/lookup/?imei=490154203237518')
    assert response.data['phone_unit'] is None
    assert response.data['sales']==[]
    assert response.data['repairs']==[]
    assert response.data['warranty']=={'active':False,'ends_on':None,'source':None}


@pytest.mark.django_db
def test_repair_warranty_uses_shop_calendar_date_at_midnight():
    from datetime import datetime, timezone as utc_timezone
    from repairs.serializers import RepairTicketSerializer
    customer=Customer.objects.create(name='Midnight warranty')
    ticket=RepairTicket.objects.create(number='R-MIDNIGHT',customer=customer,device_brand='Test',device_model='Phone',issue_description='Broken',imei='490154203237518',status='DELIVERED',delivered_at=datetime(2026,10,17,23,30,tzinfo=utc_timezone.utc),warranty_days=30)
    response=APIClient().get('/api/devices/lookup/?imei=490154203237518')
    from datetime import date
    assert response.data['warranty']['ends_on']==date(2026,11,17)
    assert RepairTicketSerializer(ticket).data['warranty_until']==date(2026,11,17)

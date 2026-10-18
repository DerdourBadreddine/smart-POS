from decimal import Decimal
import pytest
from django.utils import timezone
from catalog.models import Category, Product
from customers.models import Customer
from dashboard.services import end_of_day
from repairs.services import create_ticket, record_payment as repair_payment, change_status
from sales.services import create_sale, record_payment
from shop.models import Expense


@pytest.mark.django_db
def test_daily_report_matches_hand_calculated_cash_credit_repairs_and_expenses():
    category=Category.objects.create(name='Accessories',kind='ACCESSORY')
    product=Product.objects.create(category=category,name='Cable',sku='DAILY',cost_price='5',sell_price='25',stock_qty=10)
    customer=Customer.objects.create(name='Customer')
    create_sale(items=[{'product_id':product.pk}],customer_id=None,amount_paid=Decimal('25'),payment_method='CASH')
    credit=create_sale(items=[{'product_id':product.pk}],customer_id=customer.pk,amount_paid=Decimal('10'),payment_method='CARD')
    record_payment(sale=credit,amount=Decimal('15'),method='TRANSFER')
    repair=create_ticket(data={'customer':customer,'device_brand':'Test','device_model':'Phone','issue_description':'Broken','labor_cost':Decimal('30')})
    repair_payment(ticket=repair,amount=Decimal('30'))
    change_status(ticket=repair,new_status='DELIVERED')
    Expense.objects.create(date=timezone.localdate(),label='Supplies',amount='7.50',category='SUPPLIES')
    report=end_of_day(report_date=timezone.localdate())
    assert report['sales_total']==Decimal('50')
    assert report['sales_collected_by_method']=={'CASH':Decimal('25'),'CARD':Decimal('10'),'TRANSFER':Decimal('0')}
    assert report['debts_collected_by_method']['TRANSFER']==Decimal('15')
    assert report['repair_income']==Decimal('30')
    assert report['expenses_total']==Decimal('7.50')
    assert report['net_total']==Decimal('72.50')

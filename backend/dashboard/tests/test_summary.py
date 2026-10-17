from decimal import Decimal

import pytest
from django.utils import timezone

from catalog.models import Category, Product
from dashboard.services import dashboard_summary
from customers.models import Customer
from repairs.services import create_ticket
from sales.services import create_sale


@pytest.mark.django_db
def test_dashboard_summary_counts_sales_and_low_stock():
    category = Category.objects.create(name="Accessories", kind=Category.Kind.ACCESSORY)
    product = Product.objects.create(
        name="Cable",
        sku="CABLE-SUMMARY",
        category=category,
        cost_price=Decimal("2.00"),
        sell_price=Decimal("5.00"),
        stock_qty=1,
        low_stock_threshold=2,
    )
    customer = Customer.objects.create(name="Summary customer")
    create_sale(
        items=[{"product_id": product.id, "quantity": 1}],
        customer_id=customer.id,
        payment_method="CASH",
        amount_paid=Decimal("5.00"),
    )

    result = dashboard_summary(report_date=timezone.localdate())

    assert result["sales_count"] == 1
    assert result["sales_total"] == Decimal("5.00")
    assert result["gross_profit"] == Decimal("3.00")
    assert result["low_stock"][0]["id"] == product.id
    assert len(result["last_7_days"]) == 7

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from customers.models import Customer
from sales.models import Sale, SalePayment
from sales.services import record_payment


@transaction.atomic
def collect_payment(*, customer: Customer, amount: Decimal, method: str, note: str = "") -> None:
    customer = Customer.objects.select_for_update().get(pk=customer.pk)
    sales = list(customer.sales.select_for_update().filter(status=Sale.Status.COMPLETED).order_by("created_at", "id"))
    amount = Decimal(amount)
    if not amount.is_finite() or amount <= 0:
        raise ValidationError(_("Payment amount must be positive."))
    if method not in SalePayment.PaymentMethod.values:
        raise ValidationError(_("Invalid payment method."))
    if amount > sum((sale.balance for sale in sales), Decimal("0")):
        raise ValidationError(_("Payment cannot exceed the remaining balance."))
    for sale in sales:
        allocation = min(amount, sale.balance)
        if allocation > 0:
            record_payment(sale=sale, amount=allocation, method=method, note=note)
            amount -= allocation
        if not amount:
            break

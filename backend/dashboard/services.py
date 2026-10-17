from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.db.models import Sum

from repairs.models import RepairTicket
from sales.models import Sale, SalePayment
from shop.models import Expense


def end_of_day(*, report_date: date) -> dict:
    sales = Sale.objects.filter(created_at__date=report_date, status=Sale.Status.COMPLETED)
    payments = SalePayment.objects.filter(paid_at__date=report_date, sale__status=Sale.Status.COMPLETED)
    repairs = RepairTicket.objects.filter(delivered_at__date=report_date, status=RepairTicket.Status.DELIVERED)
    expenses = Expense.objects.filter(date=report_date)
    sales_by_method = {
        method: sales.filter(payment_method=method).aggregate(total=Sum("amount_paid"))["total"] or Decimal("0.00")
        for method in Sale.PaymentMethod.values
    }
    debts_by_method = {
        method: payments.filter(method=method).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        for method in SalePayment.PaymentMethod.values
    }
    sales_total = sales.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
    collected_sales = sum(sales_by_method.values(), Decimal("0.00"))
    collected_debts = sum(debts_by_method.values(), Decimal("0.00"))
    repair_income = sum((ticket.amount_paid for ticket in repairs), Decimal("0.00"))
    expenses_total = expenses.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    return {
        "date": report_date,
        "sales_count": sales.count(),
        "sales_total": sales_total,
        "sales_collected_by_method": sales_by_method,
        "debts_collected_by_method": debts_by_method,
        "repair_income": repair_income,
        "expenses_total": expenses_total,
        "expenses": list(expenses.values("id", "date", "label", "amount", "category", "note")),
        "net_total": collected_sales + collected_debts + repair_income - expenses_total,
    }

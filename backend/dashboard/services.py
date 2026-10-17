from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import F, Sum
from django.utils import timezone

from catalog.models import Product
from repairs.models import RepairTicket
from sales.models import Sale, SaleItem, SalePayment
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


def dashboard_summary(*, report_date: date | None = None) -> dict:
    today = report_date or timezone.localdate()
    sales = Sale.objects.filter(created_at__date=today, status=Sale.Status.COMPLETED)
    delivered_repairs = RepairTicket.objects.filter(
        delivered_at__date=today, status=RepairTicket.Status.DELIVERED
    )
    gross_profit = (
        SaleItem.objects.filter(sale__created_at__date=today, sale__status=Sale.Status.COMPLETED)
        .aggregate(
            value=Sum(F("line_total") - F("unit_cost") * F("quantity"))
        )["value"]
        or Decimal("0.00")
    )
    open_repairs = RepairTicket.objects.exclude(
        status__in=[RepairTicket.Status.DELIVERED, RepairTicket.Status.CANCELLED]
    )
    credit_owed = sum(
        (sale.balance for sale in Sale.objects.filter(status=Sale.Status.COMPLETED)),
        Decimal("0.00"),
    )
    last_7_days = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        total = (
            Sale.objects.filter(created_at__date=day, status=Sale.Status.COMPLETED)
            .aggregate(value=Sum("total"))["value"]
            or Decimal("0.00")
        )
        last_7_days.append({"date": day, "total": total})
    return {
        "date": today,
        "sales_count": sales.count(),
        "sales_total": sales.aggregate(value=Sum("total"))["value"] or Decimal("0.00"),
        "gross_profit": gross_profit,
        "repair_income": sum(
            (ticket.amount_paid for ticket in delivered_repairs), Decimal("0.00")
        ),
        "open_repairs_by_status": {
            status: open_repairs.filter(status=status).count()
            for status, _ in RepairTicket.Status.choices
            if status not in [RepairTicket.Status.DELIVERED, RepairTicket.Status.CANCELLED]
        },
        "credit_owed_total": credit_owed,
        "expenses_today": Expense.objects.filter(date=today).aggregate(
            value=Sum("amount")
        )["value"]
        or Decimal("0.00"),
        "ready_for_pickup": list(
            RepairTicket.objects.filter(status=RepairTicket.Status.READY)
            .values("id", "number", "device_brand", "device_model", "customer_id")[:10]
        ),
        "low_stock": list(
            Product.objects.filter(
                is_active=True, stock_qty__lte=F("low_stock_threshold")
            )
            .values("id", "name", "stock_qty", "low_stock_threshold")[:10]
        ),
        "last_7_days": last_7_days,
    }

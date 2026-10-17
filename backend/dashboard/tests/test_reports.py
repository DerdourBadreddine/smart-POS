from datetime import date
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from shop.models import Expense


@pytest.mark.django_db
def test_end_of_day_returns_expenses():
    Expense.objects.create(
        date=date(2026, 10, 17),
        label="Electricity",
        amount=Decimal("25.00"),
        category=Expense.Category.UTILITIES,
    )

    response = APIClient().get("/api/reports/end-of-day/?date=2026-10-17")

    assert response.status_code == 200
    assert response.data["expenses_total"] == Decimal("25.00")
    assert response.data["net_total"] == Decimal("-25.00")

from __future__ import annotations

from decimal import Decimal

from django.db import models

from common.models import TimeStampedModel


class Customer(TimeStampedModel):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=32, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def balance(self) -> Decimal:
        from sales.models import Sale

        total = Decimal("0.00")
        for sale in self.sales.filter(status=Sale.Status.COMPLETED):
            total += sale.balance
        return total

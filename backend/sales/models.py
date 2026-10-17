from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.db.models import Sum
from django.utils.translation import gettext_lazy as _

from catalog.models import Product
from common.models import TimeStampedModel


class Sale(TimeStampedModel):
    class PaymentMethod(models.TextChoices):
        CASH = "CASH", _("Cash")
        CARD = "CARD", _("Card")
        TRANSFER = "TRANSFER", _("Transfer")

    class Status(models.TextChoices):
        COMPLETED = "COMPLETED", _("Completed")
        VOIDED = "VOIDED", _("Voided")

    number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey("customers.Customer", on_delete=models.PROTECT, null=True, blank=True, related_name="sales")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return self.number

    @property
    def paid_total(self) -> Decimal:
        payments = self.payments.aggregate(total=Sum("amount"))["total"]
        return self.amount_paid + (payments or Decimal("0.00"))

    @property
    def balance(self) -> Decimal:
        return self.total - self.paid_total


class SaleItem(TimeStampedModel):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sale_items")
    phone_unit = models.ForeignKey("inventory.PhoneUnit", on_delete=models.SET_NULL, null=True, blank=True, related_name="sale_items")
    description = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    warranty_until = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return self.description


class SalePayment(TimeStampedModel):
    class PaymentMethod(models.TextChoices):
        CASH = Sale.PaymentMethod.CASH, _("Cash")
        CARD = Sale.PaymentMethod.CARD, _("Card")
        TRANSFER = Sale.PaymentMethod.TRANSFER, _("Transfer")

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    paid_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-paid_at", "-id"]

    def __str__(self) -> str:
        return f"{self.sale.number} {self.amount}"

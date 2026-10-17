from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from catalog.models import Product
from common.models import TimeStampedModel
from common.validators import validate_imei


class PhoneUnit(TimeStampedModel):
    class Condition(models.TextChoices):
        NEW = "NEW", _("New")
        USED = "USED", _("Used")
        REFURBISHED = "REFURBISHED", _("Refurbished")

    class Status(models.TextChoices):
        IN_STOCK = "IN_STOCK", _("In stock")
        RESERVED = "RESERVED", _("Reserved")
        SOLD = "SOLD", _("Sold")
        RETURNED = "RETURNED", _("Returned")

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="phone_units")
    imei = models.CharField(max_length=15, unique=True, validators=[validate_imei])
    condition = models.CharField(max_length=20, choices=Condition.choices)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    sell_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_STOCK)
    purchased_at = models.DateField()
    supplier = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-purchased_at", "imei"]
        indexes = [
            models.Index(fields=["imei"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.imei} - {self.product}"


class StockMovement(TimeStampedModel):
    class Reason(models.TextChoices):
        PURCHASE = "PURCHASE", _("Purchase")
        SALE = "SALE", _("Sale")
        REPAIR_USE = "REPAIR_USE", _("Repair use")
        ADJUSTMENT = "ADJUSTMENT", _("Adjustment")
        RETURN = "RETURN", _("Return")
        VOID = "VOID", _("Void")

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="stock_movements")
    phone_unit = models.ForeignKey(PhoneUnit, on_delete=models.SET_NULL, null=True, blank=True, related_name="stock_movements")
    quantity_change = models.IntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices)
    reference = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["reason"]),
        ]

    def __str__(self) -> str:
        return f"{self.reason} {self.quantity_change} {self.product}"

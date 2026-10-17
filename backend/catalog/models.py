from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import TimeStampedModel


class Category(TimeStampedModel):
    class Kind(models.TextChoices):
        PHONE = "PHONE", _("Phone")
        ACCESSORY = "ACCESSORY", _("Accessory")
        PART = "PART", _("Part")

    name = models.CharField(max_length=150, unique=True)
    kind = models.CharField(max_length=20, choices=Kind.choices)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Product(TimeStampedModel):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.CharField(max_length=120, blank=True)
    model_name = models.CharField(max_length=120, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    sell_price = models.DecimalField(max_digits=10, decimal_places=2)
    track_imei = models.BooleanField(default=False)
    stock_qty = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=2)
    warranty_days = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return self.name

from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import TimeStampedModel


class ShopSettings(TimeStampedModel):
    class Language(models.TextChoices):
        FR = "fr", _("French")
        AR = "ar", _("Arabic")

    shop_name = models.CharField(max_length=200, default="Smart POS")
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    currency_symbol = models.CharField(max_length=10, default="DA")
    country_dial_code = models.CharField(max_length=10, default="213")
    receipt_footer_fr = models.TextField(blank=True)
    receipt_footer_ar = models.TextField(blank=True)
    default_language = models.CharField(max_length=2, choices=Language.choices, default=Language.FR)

    class Meta:
        verbose_name = _("Shop settings")
        verbose_name_plural = _("Shop settings")

    def __str__(self) -> str:
        return self.shop_name

    @classmethod
    def get_solo(cls) -> "ShopSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Expense(TimeStampedModel):
    class Category(models.TextChoices):
        RENT = "RENT", _("Rent")
        UTILITIES = "UTILITIES", _("Utilities")
        SUPPLIES = "SUPPLIES", _("Supplies")
        SALARY = "SALARY", _("Salary")
        OTHER = "OTHER", _("Other")

    date = models.DateField()
    label = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=Category.choices)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-date", "-id"]
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:
        return self.label

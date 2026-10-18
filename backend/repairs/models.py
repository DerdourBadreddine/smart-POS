from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from catalog.models import Product
from common.models import TimeStampedModel


class RepairTicket(TimeStampedModel):
    class Status(models.TextChoices):
        RECEIVED = "RECEIVED", _("Received")
        DIAGNOSING = "DIAGNOSING", _("Diagnosing")
        WAITING_PARTS = "WAITING_PARTS", _("Waiting parts")
        IN_REPAIR = "IN_REPAIR", _("In repair")
        READY = "READY", _("Ready")
        DELIVERED = "DELIVERED", _("Delivered")
        CANCELLED = "CANCELLED", _("Cancelled")

    number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey("customers.Customer", on_delete=models.PROTECT, related_name="repair_tickets")
    device_brand = models.CharField(max_length=120)
    device_model = models.CharField(max_length=120)
    imei = models.CharField(max_length=15, blank=True)
    issue_description = models.TextField()
    accessories_left = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    deposit_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    received_at = models.DateTimeField(default=timezone.now)
    promised_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    technician_notes = models.TextField(blank=True)
    warranty_days = models.IntegerField(default=0)

    class Meta:
        ordering = ["-received_at", "-id"]
        indexes = [
            models.Index(fields=["number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["imei"]),
        ]

    def __str__(self) -> str:
        return self.number

    @property
    def parts_total(self) -> Decimal:
        total = Decimal("0.00")
        for part in self.parts.all():
            total += part.quantity * part.unit_price
        return total

    @property
    def total(self) -> Decimal:
        return self.parts_total + self.labor_cost

    @property
    def balance(self) -> Decimal:
        return self.total - self.amount_paid


class RepairPart(TimeStampedModel):
    description = models.CharField(max_length=200, default="", blank=True)
    ticket = models.ForeignKey(RepairTicket, on_delete=models.CASCADE, related_name="parts")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="repair_parts")
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.ticket.number} - {self.product}"

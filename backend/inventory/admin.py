from django.contrib import admin

from inventory.models import PhoneUnit, StockMovement


@admin.register(PhoneUnit)
class PhoneUnitAdmin(admin.ModelAdmin):
    list_display = ("imei", "product", "condition", "status", "purchased_at")
    search_fields = ("imei", "product__name", "product__sku")
    list_filter = ("condition", "status", "product")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("created_at", "product", "quantity_change", "reason", "reference")
    search_fields = ("product__name", "reference", "note")
    list_filter = ("reason",)

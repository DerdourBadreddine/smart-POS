from django.contrib import admin

from repairs.models import RepairPart, RepairTicket


class RepairPartInline(admin.TabularInline):
    model = RepairPart
    extra = 0
    readonly_fields = ("product", "quantity", "unit_price", "unit_cost")


@admin.register(RepairTicket)
class RepairTicketAdmin(admin.ModelAdmin):
    list_display = ("number", "customer", "device_brand", "device_model", "imei", "status", "received_at")
    search_fields = ("number", "customer__name", "device_brand", "device_model", "imei")
    list_filter = ("status", "received_at")
    inlines = [RepairPartInline]


@admin.register(RepairPart)
class RepairPartAdmin(admin.ModelAdmin):
    list_display = ("ticket", "product", "quantity", "unit_price")
    search_fields = ("ticket__number", "product__name")

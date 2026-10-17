from django.contrib import admin

from sales.models import Sale, SaleItem, SalePayment


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ("description", "quantity", "unit_price", "unit_cost", "line_total", "warranty_until")


class SalePaymentInline(admin.TabularInline):
    model = SalePayment
    extra = 0
    readonly_fields = ("amount", "method", "paid_at", "note")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("number", "customer", "total", "amount_paid", "status", "created_at")
    search_fields = ("number", "customer__name")
    list_filter = ("status", "payment_method", "created_at")
    inlines = [SaleItemInline, SalePaymentInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ("sale", "product", "quantity", "unit_price", "line_total")
    search_fields = ("sale__number", "product__name", "description")


@admin.register(SalePayment)
class SalePaymentAdmin(admin.ModelAdmin):
    list_display = ("sale", "amount", "method", "paid_at")
    search_fields = ("sale__number", "note")
    list_filter = ("method",)

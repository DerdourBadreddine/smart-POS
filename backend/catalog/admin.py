from django.contrib import admin

from catalog.models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "created_at")
    search_fields = ("name",)
    list_filter = ("kind",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "brand", "model_name", "stock_qty", "is_active")
    search_fields = ("name", "sku", "brand", "model_name")
    list_filter = ("category", "category__kind", "is_active")

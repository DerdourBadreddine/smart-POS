from django.contrib import admin

from shop.models import Expense, ShopSettings


@admin.register(ShopSettings)
class ShopSettingsAdmin(admin.ModelAdmin):
    list_display = ("shop_name", "phone", "currency_symbol", "default_language")

    def has_add_permission(self, request):
        return not ShopSettings.objects.exists()


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("date", "label", "amount", "category")
    search_fields = ("label", "note")
    list_filter = ("date", "category")

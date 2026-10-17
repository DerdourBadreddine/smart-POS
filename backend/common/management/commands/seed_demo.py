from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Category, Product
from customers.models import Customer
from inventory.models import PhoneUnit
from shop.models import ShopSettings


def _imei_with_check_digit(prefix_14: str) -> str:
    digits = [int(char) for char in prefix_14]
    total = 0
    for index, digit in enumerate(reversed(digits), start=1):
        if index % 2 == 1:
            doubled = digit * 2
            total += doubled if doubled < 10 else doubled - 9
        else:
            total += digit
    check_digit = (10 - (total % 10)) % 10
    return prefix_14 + str(check_digit)


class Command(BaseCommand):
    help = "Seed demo catalog, phones and customers."

    @transaction.atomic
    def handle(self, *args, **options):
        settings = ShopSettings.get_solo()
        settings.shop_name = settings.shop_name or "Smart POS"
        settings.currency_symbol = settings.currency_symbol or "DA"
        settings.country_dial_code = settings.country_dial_code or "213"
        settings.default_language = settings.default_language or "fr"
        settings.save()

        categories = {}
        for name, kind in [
            ("Phones", Category.Kind.PHONE),
            ("Chargers", Category.Kind.ACCESSORY),
            ("Cases", Category.Kind.ACCESSORY),
            ("Parts", Category.Kind.PART),
            ("Screens", Category.Kind.PART),
            ("Batteries", Category.Kind.PART),
        ]:
            categories[name], _ = Category.objects.update_or_create(name=name, defaults={"kind": kind})

        products_data = [
            ("IPH-13-128", "iPhone 13 128GB", "Apple", "iPhone 13", "Phones", Decimal("65000"), Decimal("79000"), True, 2, 365),
            ("S22-256", "Galaxy S22 256GB", "Samsung", "S22", "Phones", Decimal("52000"), Decimal("68000"), True, 1, 365),
            ("RED-12", "Redmi Note 12", "Xiaomi", "Note 12", "Phones", Decimal("28000"), Decimal("36000"), True, 3, 180),
            ("NOK-C32", "Nokia C32", "Nokia", "C32", "Phones", Decimal("18000"), Decimal("24000"), True, 2, 180),
            ("OPP-A78", "OPPO A78", "OPPO", "A78", "Phones", Decimal("30000"), Decimal("41000"), True, 2, 180),
            ("CHG-TYPEC", "USB-C Charger", "", "", "Chargers", Decimal("500"), Decimal("900"), False, 8, 0),
            ("CHG-LIGHT", "Lightning Cable", "", "", "Chargers", Decimal("400"), Decimal("750"), False, 10, 0),
            ("CASE-BLK", "Black Silicone Case", "", "", "Cases", Decimal("250"), Decimal("500"), False, 12, 0),
            ("CASE-CLR", "Clear TPU Case", "", "", "Cases", Decimal("220"), Decimal("450"), False, 12, 0),
            ("SCR-IPH13", "iPhone 13 Screen", "", "", "Screens", Decimal("16000"), Decimal("23000"), False, 2, 90),
            ("SCR-S22", "Galaxy S22 Screen", "", "", "Screens", Decimal("14000"), Decimal("21000"), False, 2, 90),
            ("BAT-IPH13", "iPhone 13 Battery", "", "", "Batteries", Decimal("7000"), Decimal("11500"), False, 2, 90),
            ("BAT-S22", "Galaxy S22 Battery", "", "", "Batteries", Decimal("6500"), Decimal("10800"), False, 2, 90),
            ("HEAD-USB", "Wired Earphones", "", "", "Chargers", Decimal("300"), Decimal("650"), False, 15, 0),
            ("POW-10K", "Power Bank 10,000mAh", "", "", "Chargers", Decimal("1800"), Decimal("3200"), False, 6, 0),
            ("GLASS-UNI", "Universal Screen Protector", "", "", "Cases", Decimal("120"), Decimal("300"), False, 20, 0),
            ("SIM-TRAY", "SIM Tray Set", "", "", "Parts", Decimal("150"), Decimal("350"), False, 10, 0),
            ("MIC-REP", "Microphone Module", "", "", "Parts", Decimal("900"), Decimal("1600"), False, 6, 0),
            ("SPK-REP", "Speaker Module", "", "", "Parts", Decimal("850"), Decimal("1500"), False, 6, 0),
            ("CAM-REP", "Camera Module", "", "", "Parts", Decimal("2500"), Decimal("4200"), False, 4, 0),
        ]

        for sku, name, brand, model_name, category_name, cost_price, sell_price, track_imei, stock_qty, warranty_days in products_data:
            Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "category": categories[category_name],
                    "brand": brand,
                    "model_name": model_name,
                    "cost_price": cost_price,
                    "sell_price": sell_price,
                    "track_imei": track_imei,
                    "stock_qty": stock_qty,
                    "low_stock_threshold": 2,
                    "warranty_days": warranty_days,
                    "is_active": True,
                },
            )

        customer_data = [
            ("Ahmed Benali", "+213555010101"),
            ("Sara Haddad", "+213555010102"),
            ("مريم بن صالح", "+213555010103"),
        ]
        for name, phone in customer_data:
            Customer.objects.update_or_create(name=name, defaults={"phone": phone})

        phone_products = list(Product.objects.filter(track_imei=True).order_by("sku"))
        imei_prefixes = [
            "35209900123456",
            "35209900123463",
            "35209900123470",
            "35209900123487",
            "35209900123494",
            "35209900123500",
            "35209900123517",
            "35209900123524",
        ]

        for index, prefix in enumerate(imei_prefixes):
            product = phone_products[index % len(phone_products)]
            PhoneUnit.objects.update_or_create(
                imei=_imei_with_check_digit(prefix),
                defaults={
                    "product": product,
                    "condition": PhoneUnit.Condition.NEW if index % 3 == 0 else PhoneUnit.Condition.USED,
                    "cost_price": product.cost_price,
                    "sell_price": product.sell_price,
                    "status": PhoneUnit.Status.IN_STOCK,
                    "purchased_at": date.today() - timedelta(days=10 + index),
                    "supplier": "Demo Supplier",
                    "notes": "",
                },
            )

        for product in phone_products:
            product.stock_qty = PhoneUnit.objects.filter(product=product, status=PhoneUnit.Status.IN_STOCK).count()
            product.save(update_fields=["stock_qty", "updated_at"])

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

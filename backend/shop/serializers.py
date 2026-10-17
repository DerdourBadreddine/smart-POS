from rest_framework import serializers

from shop.models import ShopSettings


class ShopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSettings
        fields = [
            "id",
            "shop_name",
            "address",
            "phone",
            "currency_symbol",
            "country_dial_code",
            "receipt_footer_fr",
            "receipt_footer_ar",
            "default_language",
            "created_at",
            "updated_at",
        ]

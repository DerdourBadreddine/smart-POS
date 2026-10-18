from rest_framework import serializers

from catalog.models import Category, Product
from catalog.services import save_product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "kind", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_kind = serializers.CharField(source="category.kind", read_only=True)

    def create(self, validated_data):
        return save_product(data=validated_data)

    def update(self, instance, validated_data):
        return save_product(product=instance, data=validated_data)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_name",
            "category_kind",
            "brand",
            "model_name",
            "cost_price",
            "sell_price",
            "track_imei",
            "stock_qty",
            "low_stock_threshold",
            "warranty_days",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ProductLookupSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_kind = serializers.CharField(source="category.kind", read_only=True)
    matched_phone_unit_id = serializers.IntegerField(read_only=True, allow_null=True, default=None)
    matched_imei = serializers.CharField(read_only=True, allow_null=True, default=None)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category_name",
            "category_kind",
            "sell_price",
            "stock_qty",
            "track_imei",
            "matched_phone_unit_id",
            "matched_imei",
        ]

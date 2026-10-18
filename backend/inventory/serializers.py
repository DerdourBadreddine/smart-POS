from rest_framework import serializers

from inventory.models import PhoneUnit, StockMovement
from inventory.services import receive_phone


class PhoneUnitSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        read_only_fields = ["status"]
        model = PhoneUnit
        fields = [
            "id",
            "product",
            "product_name",
            "imei",
            "condition",
            "cost_price",
            "sell_price",
            "status",
            "purchased_at",
            "supplier",
            "notes",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        return receive_phone(**validated_data)


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    phone_imei = serializers.CharField(source="phone_unit.imei", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "phone_unit",
            "phone_imei",
            "quantity_change",
            "reason",
            "reference",
            "note",
            "created_at",
        ]

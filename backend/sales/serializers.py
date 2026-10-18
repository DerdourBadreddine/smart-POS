from decimal import Decimal
from rest_framework import serializers

from sales.models import Sale, SaleItem, SalePayment
from sales.services import create_sale


class SaleItemSerializer(serializers.ModelSerializer):
    imei = serializers.CharField(source="phone_unit.imei", read_only=True, default="")
    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "phone_unit",
            "imei",
            "description",
            "quantity",
            "unit_price",
            "unit_cost",
            "line_total",
            "warranty_until",
        ]


class SaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True, default="")
    items = SaleItemSerializer(many=True, read_only=True)
    paid_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "number",
            "customer",
            "customer_name",
            "subtotal",
            "discount",
            "total",
            "payment_method",
            "amount_paid",
            "paid_total",
            "balance",
            "status",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]


class SaleInputItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False, min_value=1)
    phone_unit_id = serializers.IntegerField(required=False, min_value=1)
    quantity = serializers.IntegerField(default=1, min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0"), required=False)


class SaleCreateSerializer(serializers.Serializer):
    items = SaleInputItemSerializer(many=True, allow_empty=False)
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)

    def create(self, validated_data):
        return create_sale(**validated_data)


class SalePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalePayment
        fields = ["id", "sale", "amount", "method", "paid_at", "note"]
        read_only_fields = ["sale", "paid_at"]

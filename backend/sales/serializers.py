from rest_framework import serializers

from sales.models import Sale, SaleItem, SalePayment
from sales.services import create_sale


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "phone_unit",
            "description",
            "quantity",
            "unit_price",
            "unit_cost",
            "line_total",
            "warranty_until",
        ]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    paid_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "number",
            "customer",
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


class SaleCreateSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField(), allow_empty=False)
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

from rest_framework import serializers

from repairs.models import RepairPart, RepairTicket
from repairs.services import create_ticket


class RepairPartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = RepairPart
        fields = ["id", "product", "product_name", "quantity", "unit_price", "unit_cost"]


class RepairTicketSerializer(serializers.ModelSerializer):
    parts = RepairPartSerializer(many=True, read_only=True)
    parts_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RepairTicket
        fields = [
            "id",
            "number",
            "customer",
            "device_brand",
            "device_model",
            "imei",
            "issue_description",
            "accessories_left",
            "status",
            "estimated_cost",
            "labor_cost",
            "deposit_paid",
            "amount_paid",
            "parts_total",
            "total",
            "balance",
            "received_at",
            "promised_date",
            "completed_at",
            "delivered_at",
            "technician_notes",
            "warranty_days",
            "parts",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        return create_ticket(data=validated_data)


class RepairStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RepairTicket.Status.choices)


class RepairPartCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class RepairPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

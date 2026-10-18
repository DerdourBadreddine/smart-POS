from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone

from repairs.models import RepairPart, RepairTicket
from repairs.services import create_ticket, update_ticket


class RepairPartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="description", read_only=True)

    class Meta:
        model = RepairPart
        fields = ["id", "product", "product_name", "quantity", "unit_price", "unit_cost"]


class RepairTicketSerializer(serializers.ModelSerializer):
    warranty_until = serializers.SerializerMethodField()
    parts = RepairPartSerializer(many=True, read_only=True)
    parts_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RepairTicket
        read_only_fields = ["number", "status", "amount_paid", "received_at", "completed_at", "delivered_at"]
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
            "warranty_until",
            "parts",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        return create_ticket(data=validated_data)

    def get_warranty_until(self, obj):
        if obj.delivered_at and obj.warranty_days > 0:
            return timezone.localdate(obj.delivered_at) + timedelta(days=obj.warranty_days)
        return None

    def update(self, instance, validated_data):
        validated_data.pop("deposit_paid", None)
        return update_ticket(ticket=instance, data=validated_data)


class RepairStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RepairTicket.Status.choices)


class RepairPartCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class RepairPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

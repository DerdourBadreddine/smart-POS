from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from repairs.models import RepairTicket
from repairs.serializers import (
    RepairPartCreateSerializer,
    RepairPaymentSerializer,
    RepairStatusSerializer,
    RepairTicketSerializer,
)
from repairs.services import add_part, change_status, record_payment, remove_part


class RepairTicketViewSet(viewsets.ModelViewSet):
    queryset = RepairTicket.objects.select_related("customer").prefetch_related("parts__product").all()
    serializer_class = RepairTicketSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["number", "customer__name", "device_brand", "device_model", "imei"]
    ordering_fields = ["received_at", "number", "status"]
    filterset_fields = ["status", "customer"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("open", "").lower() == "true":
            queryset = queryset.exclude(status__in=[RepairTicket.Status.DELIVERED, RepairTicket.Status.CANCELLED])
        return queryset

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        serializer = RepairStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            ticket = change_status(ticket=self.get_object(), new_status=serializer.validated_data["status"])
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RepairTicketSerializer(ticket).data)

    @action(detail=True, methods=["post"], url_path="add-part")
    def add_part(self, request, pk=None):
        serializer = RepairPartCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            part = add_part(ticket=self.get_object(), **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        from repairs.serializers import RepairPartSerializer

        return Response(RepairPartSerializer(part).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"parts/(?P<part_id>[^/.]+)")
    def remove_part_action(self, request, pk=None, part_id=None):
        try:
            remove_part(ticket=self.get_object(), part_id=int(part_id))
        except (ValidationError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def payment(self, request, pk=None):
        serializer = RepairPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            ticket = record_payment(ticket=self.get_object(), **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RepairTicketSerializer(ticket).data)

from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from sales.models import Sale
from sales.serializers import SaleCreateSerializer, SalePaymentSerializer, SaleSerializer
from sales.services import record_payment, void_sale


class SaleViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head", "options"]
    queryset = Sale.objects.prefetch_related("items", "payments").select_related("customer").all()
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["number", "customer__name"]
    ordering_fields = ["created_at", "number", "total"]
    filterset_fields = ["status", "customer", "payment_method"]

    def get_serializer_class(self):
        return SaleCreateSerializer if self.action == "create" else SaleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        if self.request.query_params.get("has_balance", "").lower() == "true":
            queryset = queryset.filter(status=Sale.Status.COMPLETED)
            ids = [sale.pk for sale in queryset if sale.balance > 0]
            queryset = queryset.filter(pk__in=ids)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            sale = serializer.save()
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None):
        try:
            sale = void_sale(self.get_object())
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SaleSerializer(sale).data)

    @action(detail=True, methods=["post"])
    def payments(self, request, pk=None):
        serializer = SalePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payment = record_payment(sale=self.get_object(), **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(SalePaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from customers.models import Customer
from customers.serializers import CustomerSerializer
from sales.models import Sale, SalePayment
from sales.serializers import SalePaymentSerializer, SaleSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["name", "phone", "notes"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("has_balance", "").lower() == "true":
            ids = [customer.pk for customer in queryset if customer.balance > 0]
            queryset = queryset.filter(pk__in=ids)
        return queryset

    @action(detail=True, methods=["get"])
    def statement(self, request, pk=None):
        customer = self.get_object()
        sales = customer.sales.filter(status=Sale.Status.COMPLETED).prefetch_related("payments", "items")
        unpaid_sales = [sale for sale in sales if sale.balance > 0]
        payments = SalePayment.objects.filter(sale__customer=customer).select_related("sale")
        return Response(
            {
                "customer": CustomerSerializer(customer).data,
                "unpaid_sales": SaleSerializer(unpaid_sales, many=True).data,
                "payments": SalePaymentSerializer(payments, many=True).data,
            }
        )

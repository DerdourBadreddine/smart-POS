from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, viewsets
from rest_framework.permissions import AllowAny

from shop.models import Expense
from decimal import Decimal


class ExpenseSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    class Meta:
        model = Expense
        fields = ["id", "date", "label", "amount", "category", "note", "created_at", "updated_at"]


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["label", "note"]
    filterset_fields = ["category"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("date_from"):
            queryset = queryset.filter(date__gte=self.request.query_params["date_from"])
        if self.request.query_params.get("date_to"):
            queryset = queryset.filter(date__lte=self.request.query_params["date_to"])
        return queryset

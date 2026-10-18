from datetime import date

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers

from dashboard.services import end_of_day
from dashboard.services import dashboard_summary


class EndOfDayView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        class DateQuery(serializers.Serializer):
            date = serializers.DateField(required=False, default=date.today)
        serializer = DateQuery(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        report_date = serializer.validated_data["date"]
        return Response(end_of_day(report_date=report_date))


class DashboardSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(dashboard_summary())

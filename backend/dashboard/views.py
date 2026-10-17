from datetime import date

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from dashboard.services import end_of_day


class EndOfDayView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        report_date = date.fromisoformat(request.query_params.get("date", date.today().isoformat()))
        return Response(end_of_day(report_date=report_date))

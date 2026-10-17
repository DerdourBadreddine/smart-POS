from django.urls import path

from dashboard.views import EndOfDayView

urlpatterns = [
    path("reports/end-of-day/", EndOfDayView.as_view(), name="end-of-day"),
]

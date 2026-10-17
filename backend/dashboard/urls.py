from django.urls import path

from dashboard.views import DashboardSummaryView, EndOfDayView

urlpatterns = [
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("reports/end-of-day/", EndOfDayView.as_view(), name="end-of-day"),
]

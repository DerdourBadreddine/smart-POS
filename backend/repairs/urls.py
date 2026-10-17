from rest_framework.routers import DefaultRouter

from repairs.views import RepairTicketViewSet

router = DefaultRouter()
router.register("repairs", RepairTicketViewSet)

urlpatterns = router.urls

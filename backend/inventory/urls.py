from rest_framework.routers import DefaultRouter

from inventory.views import PhoneUnitViewSet, StockMovementViewSet

router = DefaultRouter()
router.register("phone-units", PhoneUnitViewSet)
router.register("stock-movements", StockMovementViewSet)

urlpatterns = router.urls

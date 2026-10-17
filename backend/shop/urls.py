from rest_framework.routers import DefaultRouter

from shop.views import ShopSettingsViewSet
from shop.views_expenses import ExpenseViewSet

router = DefaultRouter()
router.register("settings", ShopSettingsViewSet, basename="settings")
router.register("expenses", ExpenseViewSet)

urlpatterns = router.urls

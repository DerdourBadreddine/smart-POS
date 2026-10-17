from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from shop.models import ShopSettings
from shop.serializers import ShopSettingsSerializer


class ShopSettingsViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        return Response(ShopSettingsSerializer(ShopSettings.get_solo()).data)

    def retrieve(self, request, pk=None):
        return Response(ShopSettingsSerializer(ShopSettings.get_solo()).data)

    def update(self, request, pk=None, partial=False):
        settings = ShopSettings.get_solo()
        serializer = ShopSettingsSerializer(settings, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk=pk, partial=True)

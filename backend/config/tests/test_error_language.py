import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
@pytest.mark.parametrize('language,expected', [('fr','client'),('ar','عميل')])
def test_service_errors_follow_accept_language(language,expected):
    from catalog.models import Category, Product
    category=Category.objects.create(name='Test',kind='ACCESSORY')
    product=Product.objects.create(category=category,name='Cable',sku='ERROR',cost_price='1',sell_price='10',stock_qty=1)
    response=APIClient().post('/api/sales/',{'items':[{'product_id':product.pk}],'customer_id':None,'payment_method':'CASH','amount_paid':'0'},format='json',HTTP_ACCEPT_LANGUAGE=language)
    assert response.status_code==400
    assert expected in str(response.data)

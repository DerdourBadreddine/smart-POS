import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from catalog.models import Product
from inventory.models import StockMovement


@pytest.mark.django_db
def test_csv_preview_rollback_and_import_ledger():
    def upload(dry=False, qty='3'):
        content = f'sku;name;category;cost_price;sell_price;stock_qty\nCSV;Câble كابل;Accessories;1.25;2.50;{qty}\n'
        return APIClient().post('/api/products/import-csv/' + ('?dry_run=true' if dry else ''), {'file': SimpleUploadedFile('products.csv', content.encode('utf-8-sig'))})
    assert upload(True).data['created'] == 1
    assert not Product.objects.exists()
    assert not StockMovement.objects.exists()
    assert upload().data['errors'] == []
    assert Product.objects.get(sku='CSV').stock_qty == 3
    assert StockMovement.objects.get().quantity_change == 3
    assert upload(qty='-1').data['errors']
    assert Product.objects.get(sku='CSV').stock_qty == 3


@pytest.mark.django_db
def test_product_create_and_edit_write_movements():
    from catalog.models import Category
    category = Category.objects.create(name='Accessories', kind='ACCESSORY')
    client = APIClient()
    response = client.post('/api/products/', {'sku': 'NEW', 'name': 'New', 'category': category.pk, 'cost_price': '1', 'sell_price': '2', 'stock_qty': 4}, format='json')
    assert response.status_code == 201
    assert StockMovement.objects.get().quantity_change == 4
    response = client.patch(f'/api/products/{response.data["id"]}/', {'stock_qty': 2}, format='json')
    assert response.status_code == 200
    assert list(StockMovement.objects.order_by('id').values_list('quantity_change', flat=True)) == [4, -2]

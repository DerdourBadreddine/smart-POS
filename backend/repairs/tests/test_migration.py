import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


@pytest.mark.django_db(transaction=True)
def test_description_migration_preserves_existing_repair_part():
    executor=MigrationExecutor(connection)
    executor.migrate([('repairs','0001_initial')])
    apps=executor.loader.project_state([('repairs','0001_initial')]).apps
    Customer=apps.get_model('customers','Customer')
    Category=apps.get_model('catalog','Category')
    Product=apps.get_model('catalog','Product')
    Ticket=apps.get_model('repairs','RepairTicket')
    Part=apps.get_model('repairs','RepairPart')
    customer=Customer.objects.create(name='Existing customer')
    category=Category.objects.create(name='Parts',kind='PART')
    product=Product.objects.create(name='Original screen',sku='MIGRATION',category=category,cost_price='5',sell_price='10',stock_qty=2)
    ticket=Ticket.objects.create(number='R-MIGRATION',customer=customer,device_brand='Test',device_model='Phone',issue_description='Broken',labor_cost='20')
    part=Part.objects.create(ticket=ticket,product=product,quantity=1,unit_price='10',unit_cost='5')
    executor=MigrationExecutor(connection)
    executor.migrate([('repairs','0002_repairpart_description')])
    apps=executor.loader.project_state([('repairs','0002_repairpart_description')]).apps
    migrated=apps.get_model('repairs','RepairPart').objects.get(pk=part.pk)
    assert migrated.description=='Original screen'
    assert migrated.quantity==1
    assert str(migrated.unit_price)=='10.00'
    assert apps.get_model('catalog','Product').objects.get(pk=product.pk).stock_qty==2
    assert apps.get_model('customers','Customer').objects.filter(pk=customer.pk).exists()

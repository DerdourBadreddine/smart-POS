from django.db import migrations, models


def preserve_existing_names(apps, schema_editor):
    Part = apps.get_model("repairs", "RepairPart")
    for part in Part.objects.using(schema_editor.connection.alias).select_related("product").iterator():
        Part.objects.using(schema_editor.connection.alias).filter(pk=part.pk).update(description=part.product.name)


class Migration(migrations.Migration):
    dependencies = [("repairs", "0001_initial")]
    operations = [
        migrations.AddField(model_name="repairpart", name="description", field=models.CharField(max_length=200, default="", blank=True)),
        migrations.RunPython(preserve_existing_names, migrations.RunPython.noop),
    ]

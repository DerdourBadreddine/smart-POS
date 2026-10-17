from datetime import date, timedelta

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import PhoneUnit
from repairs.models import RepairTicket
from sales.models import SaleItem


class DeviceLookupView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        imei = request.query_params.get("imei", "").strip()
        unit = PhoneUnit.objects.select_related("product").filter(imei=imei).first()
        sale_items = list(
            SaleItem.objects.filter(phone_unit__imei=imei, sale__status="COMPLETED")
            .select_related("sale", "sale__customer", "product")
        )
        repairs = list(RepairTicket.objects.filter(imei=imei).select_related("customer"))
        sale_dates = [item.warranty_until for item in sale_items if item.warranty_until]
        repair_dates = [
            ticket.delivered_at.date() + timedelta(days=ticket.warranty_days)
            for ticket in repairs
            if ticket.delivered_at and ticket.warranty_days > 0
        ]
        warranty_end = max(sale_dates + repair_dates, default=None)
        source = "sale" if sale_dates and (not repair_dates or max(sale_dates) >= max(repair_dates)) else "repair"
        return Response(
            {
                "phone_unit": (
                    {
                        "id": unit.id,
                        "imei": unit.imei,
                        "product": {"id": unit.product_id, "name": unit.product.name, "sku": unit.product.sku},
                        "status": unit.status,
                    }
                    if unit
                    else None
                ),
                "sales": [
                    {
                        "number": item.sale.number,
                        "date": item.sale.created_at.date(),
                        "customer": item.sale.customer.name if item.sale.customer else None,
                        "price": item.unit_price,
                        "warranty_until": item.warranty_until,
                    }
                    for item in sale_items
                ],
                "repairs": [
                    {
                        "number": ticket.number,
                        "status": ticket.status,
                        "received_at": ticket.received_at,
                        "delivered_at": ticket.delivered_at,
                        "warranty_days": ticket.warranty_days,
                    }
                    for ticket in repairs
                ],
                "warranty": {
                    "active": warranty_end is not None and warranty_end >= date.today(),
                    "ends_on": warranty_end,
                    "source": source if warranty_end else None,
                },
            }
        )

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Category,
  Customer,
  DeviceHistory,
  Expense,
  Page,
  PhoneUnit,
  Product,
  RepairPart,
  RepairTicket,
  Sale,
  SaleCreate,
  SalePayment,
  ShopSettings,
  StockMovement,
} from '../models/models';
import { BaseApi } from './base-api';

@Injectable({ providedIn: 'root' })
export class CategoriesApi extends BaseApi<Category> {
  constructor() {
    super('categories');
  }
}

@Injectable({ providedIn: 'root' })
export class ProductsApi extends BaseApi<Product> {
  private readonly client = inject(HttpClient);

  constructor() {
    super('products');
  }

  lookup(q: string): Observable<Product[]> {
    return this.client.get<Product[]>('/api/products/lookup/', { params: { q } });
  }

  adjustStock(id: number, payload: { delta: number; reason: string; note: string }): Observable<Product> {
    return this.client.post<Product>(`/api/products/${id}/adjust-stock/`, payload);
  }
}

@Injectable({ providedIn: 'root' })
export class PhoneUnitsApi extends BaseApi<PhoneUnit> {
  constructor() {
    super('phone-units');
  }

  byProduct(productId: number, status?: PhoneUnit['status']): Observable<Page<PhoneUnit>> {
    return this.list({ product: productId, ...(status ? { status } : {}) });
  }
}

@Injectable({ providedIn: 'root' })
export class StockMovementsApi extends BaseApi<StockMovement> {
  constructor() {
    super('stock-movements');
  }

  byProduct(productId: number): Observable<Page<StockMovement>> {
    return this.list({ product: productId });
  }
}

@Injectable({ providedIn: 'root' })
export class CustomersApi extends BaseApi<Customer> {
  private readonly client = inject(HttpClient);

  constructor() {
    super('customers');
  }

  statement(id: number): Observable<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(`/api/customers/${id}/statement/`);
  }
}

@Injectable({ providedIn: 'root' })
export class SalesApi extends BaseApi<Sale> {
  private readonly client = inject(HttpClient);

  constructor() {
    super('sales');
  }

  createSale(payload: SaleCreate): Observable<Sale> {
    return this.client.post<Sale>('/api/sales/', payload);
  }

  void(id: number): Observable<Sale> {
    return this.client.post<Sale>(`/api/sales/${id}/void/`, {});
  }

  payment(id: number, payload: Omit<SalePayment, 'id' | 'sale' | 'paid_at'>): Observable<SalePayment> {
    return this.client.post<SalePayment>(`/api/sales/${id}/payments/`, payload);
  }
}

@Injectable({ providedIn: 'root' })
export class RepairsApi extends BaseApi<RepairTicket> {
  private readonly client = inject(HttpClient);

  constructor() {
    super('repairs');
  }

  status(id: number, status: string): Observable<RepairTicket> {
    return this.client.post<RepairTicket>(`/api/repairs/${id}/status/`, { status });
  }

  addPart(id: number, payload: { product_id: number; quantity: number; unit_price?: number }): Observable<RepairPart> {
    return this.client.post<RepairPart>(`/api/repairs/${id}/add-part/`, payload);
  }

  removePart(id: number, partId: number): Observable<void> {
    return this.client.delete<void>(`/api/repairs/${id}/parts/${partId}/`);
  }

  payment(id: number, amount: number): Observable<RepairTicket> {
    return this.client.post<RepairTicket>(`/api/repairs/${id}/payment/`, { amount });
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly client = inject(HttpClient);

  get(): Observable<ShopSettings> {
    return this.client.get<ShopSettings>('/api/settings/');
  }

  update(payload: Partial<ShopSettings>): Observable<ShopSettings> {
    return this.client.put<ShopSettings>('/api/settings/1/', payload);
  }
}

@Injectable({ providedIn: 'root' })
export class ExpensesApi extends BaseApi<Expense> {
  constructor() {
    super('expenses');
  }
}

@Injectable({ providedIn: 'root' })
export class DevicesApi {
  private readonly client = inject(HttpClient);

  lookup(imei: string): Observable<DeviceHistory> {
    return this.client.get<DeviceHistory>('/api/devices/lookup/', { params: { imei } });
  }
}

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly client = inject(HttpClient);

  endOfDay(date?: string): Observable<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>('/api/reports/end-of-day/', {
      params: date ? { date } : {},
    });
  }
}

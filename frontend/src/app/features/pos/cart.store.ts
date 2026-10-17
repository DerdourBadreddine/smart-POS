import { computed, Injectable, signal } from '@angular/core';

import { PhoneUnit, Product } from '../../core/models/models';

export interface CartLine {
  key: string;
  productId: number;
  phoneUnitId: number | null;
  imei: string | null;
  name: string;
  quantity: number;
  available: number;
  unitPrice: number;
}

@Injectable()
export class CartStore {
  readonly lines = signal<CartLine[]>([]);
  readonly discount = signal(0);
  readonly subtotal = computed(() => this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  readonly total = computed(() => Math.max(0, this.subtotal() - this.discount()));

  addProduct(product: Product): void {
    const existing = this.lines().find((line) => line.productId === product.id && !line.phoneUnitId);
    if (existing) {
      this.setQuantity(existing.key, Math.min(existing.quantity + 1, product.stock_qty));
      return;
    }
    this.lines.update((lines) => [
      ...lines,
      {
        key: `product-${product.id}`,
        productId: product.id,
        phoneUnitId: null,
        imei: null,
        name: product.name,
        quantity: 1,
        available: product.stock_qty,
        unitPrice: product.sell_price,
      },
    ]);
  }

  addPhone(product: Product, unit: PhoneUnit): void {
    if (this.lines().some((line) => line.phoneUnitId === unit.id)) return;
    this.lines.update((lines) => [
      ...lines,
      {
        key: `phone-${unit.id}`,
        productId: product.id,
        phoneUnitId: unit.id,
        imei: unit.imei,
        name: product.name,
        quantity: 1,
        available: 1,
        unitPrice: unit.sell_price,
      },
    ]);
  }

  remove(key: string): void {
    this.lines.update((lines) => lines.filter((line) => line.key !== key));
  }

  setQuantity(key: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(key);
      return;
    }
    this.lines.update((lines) => lines.map((line) => line.key === key ? { ...line, quantity: Math.min(quantity, line.available) } : line));
  }

  setPrice(key: string, unitPrice: number): void {
    if (Number.isNaN(unitPrice) || unitPrice < 0) return;
    this.lines.update((lines) => lines.map((line) => line.key === key ? { ...line, unitPrice } : line));
  }

  clear(): void {
    this.lines.set([]);
    this.discount.set(0);
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';

import { SettingsApi } from '../api/resource-apis';
import { ShopSettings } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly api = inject(SettingsApi);
  private readonly settings = signal<ShopSettings | null>(null);
  readonly value = this.settings.asReadonly();
  readonly shopName = computed(() => this.settings()?.shop_name ?? 'Smart POS');
  readonly currency = computed(() => this.settings()?.currency_symbol ?? 'DA');

  load(): Promise<void> {
    return new Promise((resolve) => {
      this.api.get().subscribe({
        next: (settings) => {
          this.settings.set(settings);
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  update(settings: ShopSettings): void {
    this.settings.set(settings);
  }
}

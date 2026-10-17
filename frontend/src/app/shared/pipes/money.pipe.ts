import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';

import { SettingsStore } from '../../core/stores/settings.store';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  private readonly currency = inject(CurrencyPipe);
  private readonly settings = inject(SettingsStore);

  transform(value: number | null | undefined): string {
    return this.currency.transform(value ?? 0, this.settings.currency(), 'symbol', '1.2-2') ?? '';
  }
}

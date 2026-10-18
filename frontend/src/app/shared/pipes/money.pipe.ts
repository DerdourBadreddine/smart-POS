import { Pipe, PipeTransform, inject } from '@angular/core';

import { SettingsStore } from '../../core/stores/settings.store';
import { LanguageService } from '../../core/i18n/language.service';

@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  private readonly settings = inject(SettingsStore);

  transform(value: number | string | null | undefined): string {
    const numeric = Number(value ?? 0);
    const formatted = new Intl.NumberFormat(this.language.language() === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: 'latn',
    }).format(Number.isFinite(numeric) ? numeric : 0).replace(/\u202f/g, '\u00a0');
    return `\u2066${formatted}\u00a0${this.settings.currency()}\u2069`;
  }
}

import { Pipe, PipeTransform, inject } from '@angular/core';

import arTranslations from '../../../assets/i18n/ar.json';
import frTranslations from '../../../assets/i18n/fr.json';
import { LanguageService } from './language.service';

type TranslationTree = Record<string, unknown>;

@Pipe({ name: 'transloco', pure: false })
export class TranslocoPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(key: string): string {
    const translations = this.language.language() === 'ar' ? arTranslations : frTranslations;
    const value = key.split('.').reduce<unknown>(
      (current, segment) =>
        current && typeof current === 'object'
          ? (current as TranslationTree)[segment]
          : undefined,
      translations,
    );
    return typeof value === 'string' ? value : key;
  }
}

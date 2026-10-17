import { Injectable } from '@angular/core';
import {
  TranslocoMissingHandler,
  TranslocoMissingHandlerData,
} from '@jsverse/transloco';

import arTranslations from '../../../assets/i18n/ar.json';
import frTranslations from '../../../assets/i18n/fr.json';

type TranslationTree = Record<string, unknown>;

@Injectable()
export class TranslationMissingHandler implements TranslocoMissingHandler {
  handle(key: string, data: TranslocoMissingHandlerData): string {
    const translations = data.activeLang === 'ar' ? arTranslations : frTranslations;
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

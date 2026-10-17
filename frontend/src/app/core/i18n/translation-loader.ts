import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { TranslocoLoader } from '@jsverse/transloco';
import arTranslations from '../../../assets/i18n/ar.json';
import frTranslations from '../../../assets/i18n/fr.json';

@Injectable({ providedIn: 'root' })
export class TranslationLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    return of(lang === 'ar' ? arTranslations : frTranslations);
  }
}

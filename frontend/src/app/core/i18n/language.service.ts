import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';

import { ShopSettings } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly transloco = inject(TranslocoService);
  readonly language = signal<'fr' | 'ar'>(
    (localStorage.getItem('smart-pos-language') as 'fr' | 'ar' | null) ?? 'fr',
  );

  initialize(): void {
    this.http
      .get<ShopSettings>('/api/settings/')
      .pipe(catchError(() => of(null)))
      .subscribe((settings) => {
        if (!localStorage.getItem('smart-pos-language') && settings?.default_language) {
          this.setLanguage(settings.default_language);
        } else {
          this.apply(this.language());
        }
      });
  }

  toggle(): void {
    this.setLanguage(this.language() === 'fr' ? 'ar' : 'fr');
  }

  setLanguage(language: 'fr' | 'ar'): void {
    this.language.set(language);
    localStorage.setItem('smart-pos-language', language);
    this.apply(language);
  }

  private apply(language: 'fr' | 'ar'): void {
    this.document.documentElement.lang = language;
    this.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.transloco.setActiveLang(language);
  }
}

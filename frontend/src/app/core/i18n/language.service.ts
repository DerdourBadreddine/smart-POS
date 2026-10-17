import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, firstValueFrom, of } from 'rxjs';

import arTranslations from '../../../assets/i18n/ar.json';
import frTranslations from '../../../assets/i18n/fr.json';
import { ShopSettings } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly transloco = inject(TranslocoService);
  readonly language = signal<'fr' | 'ar'>(
    (localStorage.getItem('smart-pos-language') as 'fr' | 'ar' | null) ?? 'fr',
  );

  async initialize(): Promise<void> {
    const settings = await firstValueFrom(
      this.http.get<ShopSettings>('/api/settings/').pipe(catchError(() => of(null))),
    );
    const selectedLanguage =
      !localStorage.getItem('smart-pos-language') && settings?.default_language
        ? settings.default_language
        : this.language();
    await this.loadLanguage(selectedLanguage);
  }

  toggle(): void {
    void this.setLanguage(this.language() === 'fr' ? 'ar' : 'fr');
  }

  async setLanguage(language: 'fr' | 'ar'): Promise<void> {
    await this.loadLanguage(language);
  }

  private async loadLanguage(language: 'fr' | 'ar'): Promise<void> {
    try {
      const translations = language === 'ar' ? arTranslations : frTranslations;
      this.transloco.setTranslation(translations, language, { merge: false });
      await firstValueFrom(this.transloco.load(language));
      this.language.set(language);
      localStorage.setItem('smart-pos-language', language);
      this.apply(language);
    } catch (error) {
      console.error('Smart POS translations failed to load', {
        language,
        url: `/assets/i18n/${language}.json`,
        error,
      });
    }
  }

  private apply(language: 'fr' | 'ar'): void {
    this.document.documentElement.lang = language;
    this.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.transloco.setActiveLang(language);
  }
}

import { CurrencyPipe } from '@angular/common';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTransloco, provideTranslocoConfig } from '@jsverse/transloco';

import { errorInterceptor } from './core/interceptors/error.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { LanguageService } from './core/i18n/language.service';
import { TranslationLoader } from './core/i18n/translation-loader';
import { SettingsStore } from './core/stores/settings.store';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([languageInterceptor, errorInterceptor])),
    CurrencyPipe,
    provideTransloco({
      config: {
        availableLangs: ['fr', 'ar'],
        defaultLang: 'fr',
        reRenderOnLangChange: true,
        prodMode: false,
      },
      loader: TranslationLoader,
    }),
    provideTranslocoConfig({
      missingHandler: { logMissingKey: false },
    }),
    provideAppInitializer(() => {
      const language = inject(LanguageService);
      const settings = inject(SettingsStore);
      language.initialize();
      return settings.load();
    }),
  ],
};

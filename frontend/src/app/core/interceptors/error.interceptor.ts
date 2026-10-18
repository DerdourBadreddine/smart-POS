import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

export function fieldErrors(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(fieldErrors).filter(Boolean).join(' · ');
  if (value && typeof value === 'object') return Object.entries(value).map(([key, error]) => `${['detail', 'non_field_errors'].includes(key) ? '' : key + ': '}${fieldErrors(error)}`).join(' · ');
  return '';
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);
  const i18n = inject(TranslocoService);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const serverMessage = typeof error.error === 'object' ? fieldErrors(error.error) : '';
      const message = error.status === 0 ? i18n.translate('errors.network') : serverMessage || i18n.translate('errors.request');
      if (isDevMode()) console.error('Smart POS request failed', {
        method: request.method,
        url: request.urlWithParams,
        status: error.status,
        message: serverMessage ?? error.message,
        error: error.error,
      });
      snackBar.open(message, i18n.translate('common.close'), { duration: 7000 });
      return throwError(() => error);
    }),
  );
};

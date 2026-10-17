import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as { detail?: string; message?: string } | string | null;
      const serverMessage =
        typeof body === 'string'
          ? body
          : body?.detail ?? body?.message;
      const message = serverMessage
        ? `[${error.status}] ${serverMessage}`
        : `[${error.status}] Request failed. Please try again.`;
      console.error('Smart POS request failed', {
        method: request.method,
        url: request.urlWithParams,
        status: error.status,
        message: serverMessage ?? error.message,
        error: error.error,
      });
      snackBar.open(message, 'OK', { duration: 5000 });
      return throwError(() => error);
    }),
  );
};

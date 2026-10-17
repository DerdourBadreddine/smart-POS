import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as { detail?: string } | null;
      const message = body?.detail ?? 'Request failed. Please try again.';
      snackBar.open(message, 'OK', { duration: 5000 });
      return throwError(() => error);
    }),
  );
};

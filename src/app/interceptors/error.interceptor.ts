import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { ChronoscopeError, parseErrorBody } from '@app/model/chronoscope-error.model';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error;
      const skipToast = req.context.get(SKIP_ERROR_TOAST);

      // Blob bodies (responseType: 'blob') require async text extraction
      if (body instanceof Blob) {
        return from(body.text().catch(() => '')).pipe(
          switchMap((text) => {
            const chronoError = parseErrorBody(text, error);
            if (!skipToast) {
              showChronoErrorToast(notificationService, chronoError);
            }
            return throwError(() => chronoError);
          }),
        );
      }

      // String/object bodies (responseType: 'text' or 'json') — parseErrorBody handles both
      const chronoError = parseErrorBody(body, error);
      if (!skipToast) {
        showChronoErrorToast(notificationService, chronoError);
      }
      return throwError(() => chronoError);
    }),
  );
};

function showChronoErrorToast(notificationService: NotificationService, chronoError: ChronoscopeError): void {
  if (chronoError.status === 0) {
    notificationService.error('Unable to reach the server. Please check your connection.', {
      title: 'Connection Error',
    });
    return;
  }

  notificationService.error(chronoError.message, {
    title: chronoError.title,
    fieldErrors: chronoError.fieldErrors,
  });
}

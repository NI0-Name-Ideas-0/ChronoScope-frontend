import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { ChronoscopeError, parseErrorBody } from '@app/model/chronoscope-error.model';
import { TranslocoService } from '@jsverse/transloco';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const translocoService = inject(TranslocoService);

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
              showChronoErrorToast(notificationService, chronoError, translocoService);
            }
            return throwError(() => chronoError);
          }),
        );
      }

      // String/object bodies (responseType: 'text' or 'json') — parseErrorBody handles both
      const chronoError = parseErrorBody(body, error);
      if (!skipToast) {
        showChronoErrorToast(notificationService, chronoError, translocoService);
      }
      return throwError(() => chronoError);
    }),
  );
};

function showChronoErrorToast(notificationService: NotificationService, chronoError: ChronoscopeError, translocoService: TranslocoService): void {
  if (chronoError.status === 0) {
    notificationService.error(translocoService.translate('TOAST_CONNECTION_ERROR_MESSAGE'), {
      title: translocoService.translate('TOAST_CONNECTION_ERROR_TITLE'),
    });
    return;
  }

  // For known error codes, use a localized title; otherwise fall back to the title
  // already resolved by ChronoscopeError (ProblemDetail title or status-based string).
  const title = chronoError.errorCode
    ? translocoService.translate('ERROR_TITLE_' + chronoError.errorCode)
    : chronoError.title;

  notificationService.error(chronoError.message, {
    title,
    fieldErrors: chronoError.fieldErrors,
  });
}

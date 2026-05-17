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

  let localizedTitle: string;
  if (chronoError.errorCode) {
    localizedTitle = translocoService.translate('ERROR_TITLE_' + chronoError.errorCode);
  } else if (chronoError.status >= 500) {
    localizedTitle = translocoService.translate('ERROR_FALLBACK_SERVER');
  } else if (chronoError.status === 404) {
    localizedTitle = translocoService.translate('ERROR_FALLBACK_NOT_FOUND');
  } else if (chronoError.status === 403) {
    localizedTitle = translocoService.translate('ERROR_FALLBACK_FORBIDDEN');
  } else if (chronoError.status === 401) {
    localizedTitle = translocoService.translate('ERROR_FALLBACK_UNAUTHORIZED');
  } else if (chronoError.status >= 400) {
    localizedTitle = translocoService.translate('ERROR_FALLBACK_REQUEST');
  } else {
    localizedTitle = translocoService.translate('ERROR_FALLBACK_GENERIC');
  }

  const resolvedMessage = (!chronoError.errorCode && !chronoError.detail)
    ? translocoService.translate('ERROR_FALLBACK_MESSAGE')
    : chronoError.message;

  notificationService.error(resolvedMessage, {
    title: localizedTitle,
    fieldErrors: chronoError.fieldErrors,
  });
}

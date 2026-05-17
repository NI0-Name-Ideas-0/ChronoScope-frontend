import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { ChronoscopeError, parseErrorBody } from '@app/model/chronoscope-error.model';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!req.context.get(SKIP_ERROR_TOAST)) {
        showErrorToast(notificationService, error);
      }

      const body = error.error;
      if (body instanceof Blob) {
        return throwError(() => error);
      }
      return throwError(() => parseErrorBody(body, error));
    }),
  );
};

function showErrorToast(notificationService: NotificationService, error: HttpErrorResponse): void {
  if (error.status === 0) {
    notificationService.error('Unable to reach the server. Please check your connection.', {
      title: 'Connection Error',
    });
    return;
  }

  const body = error.error;

  if (body instanceof Blob) {
    body.text().then((text) => {
      const parsed = tryParseJson(text);
      const chronoError = parseErrorBody(parsed, error);
      notificationService.error(chronoError.message, {
        title: chronoError.title,
        fieldErrors: chronoError.fieldErrors,
      });
    }).catch(() => {
      const chronoError = parseErrorBody(undefined, error);
      notificationService.error(chronoError.message, { title: chronoError.title });
    });
    return;
  }

  const chronoError = parseErrorBody(body, error);
  notificationService.error(chronoError.message, {
    title: chronoError.title,
    fieldErrors: chronoError.fieldErrors,
  });
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

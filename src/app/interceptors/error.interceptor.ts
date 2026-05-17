import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { ProblemDetail } from '../../api/models/problem-detail';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!req.context.get(SKIP_ERROR_TOAST)) {
        const message = parseErrorMessage(error);
        notificationService.error(message);
      }
      return throwError(() => error);
    }),
  );
};

function parseErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to reach the server. Please check your connection.';
  }

  const body = error.error;

  if (isProblemDetail(body)) {
    return body.detail || body.title || fallbackMessage(error);
  }

  if (typeof body === 'string' && body.length > 0 && body.length < 200) {
    return body;
  }

  return fallbackMessage(error);
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return typeof body === 'object' && body !== null && ('detail' in body || 'title' in body);
}

function fallbackMessage(error: HttpErrorResponse): string {
  if (error.statusText && error.statusText !== 'Unknown Error') {
    return `Request failed: ${error.statusText}`;
  }
  return 'An unexpected error occurred';
}

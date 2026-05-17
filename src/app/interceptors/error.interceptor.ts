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
        showErrorToast(notificationService, error);
      }
      return throwError(() => error);
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
      const { title, message } = extractMessage(parsed, error);
      notificationService.error(message, { title });
    }).catch(() => {
      notificationService.error(fallbackMessage(error), { title: statusTitle(error) });
    });
    return;
  }

  const { title, message } = extractMessage(body, error);
  notificationService.error(message, { title });
}

function extractMessage(body: unknown, error: HttpErrorResponse): { title: string; message: string } {
  if (isProblemDetail(body)) {
    return {
      title: body.title || statusTitle(error),
      message: body.detail || body.title || fallbackMessage(error),
    };
  }

  if (typeof body === 'string' && body.length > 0 && body.length < 200) {
    return { title: statusTitle(error), message: body };
  }

  return { title: statusTitle(error), message: fallbackMessage(error) };
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return typeof body === 'object' && body !== null && ('detail' in body || 'title' in body);
}

function statusTitle(error: HttpErrorResponse): string {
  if (error.status >= 500) return 'Server Error';
  if (error.status === 404) return 'Not Found';
  if (error.status === 403) return 'Access Denied';
  if (error.status === 401) return 'Unauthorized';
  if (error.status >= 400) return 'Request Error';
  return 'Error';
}

function fallbackMessage(error: HttpErrorResponse): string {
  if (error.statusText && error.statusText !== 'Unknown Error') {
    return `Request failed: ${error.statusText}`;
  }
  return 'An unexpected error occurred';
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

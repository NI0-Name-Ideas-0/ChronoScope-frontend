import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '@api/models/problem-detail';

export interface FieldError {
  field: string;
  message: string;
}

export type ApiErrorCode =
  | 'API_NOT_IMPLEMENTED'
  | 'INSUFFICIENT_SLOTS'
  | 'RESOURCE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_REQUEST'
  | 'ACCESS_DENIED'
  | 'ACCOUNT_NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export const ERROR_CODE_TITLES: Record<ApiErrorCode, string> = {
  API_NOT_IMPLEMENTED: 'Not Implemented',
  INSUFFICIENT_SLOTS: 'Planning Failed',
  RESOURCE_NOT_FOUND: 'Not Found',
  VALIDATION_ERROR: 'Validation Failed',
  INVALID_REQUEST: 'Invalid Request',
  ACCESS_DENIED: 'Access Denied',
  ACCOUNT_NOT_FOUND: 'Account Not Found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
};

function isValidErrorCode(code: unknown): code is ApiErrorCode {
  return typeof code === 'string' && code in ERROR_CODE_TITLES;
}

function statusTitle(error: HttpErrorResponse): string {
  if (error.status >= 500) return 'Server Error';
  if (error.status === 404) return 'Not Found';
  if (error.status === 403) return 'Access Denied';
  if (error.status === 401) return 'Unauthorized';
  if (error.status >= 400) return 'Request Error';
  return 'Error';
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return typeof body === 'object' && body !== null && ('detail' in body || 'title' in body);
}

export class ChronoscopeError extends Error {
  readonly errorCode: ApiErrorCode | undefined;
  readonly typeUri: string | undefined;
  readonly fieldErrors: FieldError[] | undefined;
  readonly detail: string | undefined;
  readonly title: string;
  readonly status: number;
  readonly httpError: HttpErrorResponse;

  constructor(httpError: HttpErrorResponse, body?: unknown) {
    const parsed = isProblemDetail(body) ? body : undefined;

    const rawCode = parsed?.properties?.['errorCode'];
    const errorCode = isValidErrorCode(rawCode) ? rawCode : undefined;
    const typeUri = parsed?.type ?? undefined;
    const rawFieldErrors = parsed?.properties?.['fieldErrors'];
    const fieldErrors = Array.isArray(rawFieldErrors) ? rawFieldErrors as FieldError[] : undefined;
    const detail = parsed?.detail ?? undefined;

    let title: string;
    if (errorCode) {
      title = ERROR_CODE_TITLES[errorCode];
    } else if (parsed?.title) {
      title = parsed.title;
    } else {
      title = statusTitle(httpError);
    }

    const message = detail || (parsed?.title ?? fallbackMessage(httpError));
    super(message);

    this.name = 'ChronoscopeError';
    this.errorCode = errorCode;
    this.typeUri = typeUri;
    this.fieldErrors = fieldErrors;
    this.detail = detail;
    this.title = title;
    this.status = httpError.status;
    this.httpError = httpError;
  }
}

function fallbackMessage(error: HttpErrorResponse): string {
  if (error.statusText && error.statusText !== 'Unknown Error') {
    return `Request failed: ${error.statusText}`;
  }
  return 'An unexpected error occurred';
}

export function parseErrorBody(body: unknown, error: HttpErrorResponse): ChronoscopeError {
  // Normalize: when responseType is 'text', the error body arrives as a raw JSON string
  const normalized = typeof body === 'string' ? safeJsonParse(body) : body;
  return new ChronoscopeError(error, normalized);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

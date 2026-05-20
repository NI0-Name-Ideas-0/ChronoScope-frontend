import { Injectable } from '@angular/core';

const ERROR_KEY_MAP: Record<string, string> = {
  required: 'VALIDATION_REQUIRED',
  email: 'VALIDATION_EMAIL',
  minlength: 'VALIDATION_MIN_LENGTH',
  maxlength: 'VALIDATION_MAX_LENGTH',
  min: 'VALIDATION_MIN',
  max: 'VALIDATION_MAX',
  pattern: 'VALIDATION_PATTERN',
};

@Injectable({ providedIn: 'root' })
export class ValidationService {
  getErrorTranslationKey(
    errors: Record<string, unknown> | null,
    overrideMap?: Record<string, string>,
  ): string | null {
    if (!errors) return null;

    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return null;

    if (overrideMap && overrideMap[firstKey]) {
      return overrideMap[firstKey];
    }

    return ERROR_KEY_MAP[firstKey] ?? 'VALIDATION_GENERIC';
  }

  getErrorParams(errors: Record<string, unknown> | null): Record<string, unknown> {
    if (!errors) return {};

    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return {};

    const value = errors[firstKey];
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

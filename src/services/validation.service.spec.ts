import { TestBed } from '@angular/core/testing';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  describe('getErrorTranslationKey', () => {
    it('returns VALIDATION_REQUIRED for required error', () => {
      expect(service.getErrorTranslationKey({ required: true }, undefined)).toBe('VALIDATION_REQUIRED');
    });

    it('returns VALIDATION_EMAIL for email error', () => {
      expect(service.getErrorTranslationKey({ email: true }, undefined)).toBe('VALIDATION_EMAIL');
    });

    it('returns VALIDATION_MIN_LENGTH for minlength error', () => {
      expect(service.getErrorTranslationKey({ minlength: { requiredLength: 3 } }, undefined)).toBe('VALIDATION_MIN_LENGTH');
    });

    it('returns VALIDATION_MIN for min error', () => {
      expect(service.getErrorTranslationKey({ min: { min: 5 } }, undefined)).toBe('VALIDATION_MIN');
    });

    it('returns VALIDATION_MAX for max error', () => {
      expect(service.getErrorTranslationKey({ max: { max: 100 } }, undefined)).toBe('VALIDATION_MAX');
    });

    it('returns VALIDATION_PATTERN for pattern error', () => {
      expect(service.getErrorTranslationKey({ pattern: true }, undefined)).toBe('VALIDATION_PATTERN');
    });

    it('returns override map value when provided', () => {
      expect(service.getErrorTranslationKey({ customKey: true }, { customKey: 'MY_CUSTOM' })).toBe('MY_CUSTOM');
    });

    it('returns null when errors is null', () => {
      expect(service.getErrorTranslationKey(null, undefined)).toBeNull();
    });

    it('returns VALIDATION_GENERIC for unknown error key', () => {
      expect(service.getErrorTranslationKey({ unknownKey: true }, undefined)).toBe('VALIDATION_GENERIC');
    });

    it('returns translation key for first error only when multiple exist', () => {
      expect(service.getErrorTranslationKey({ required: true, email: true }, undefined)).toBe('VALIDATION_REQUIRED');
    });
  });

  describe('getErrorParams', () => {
    it('returns empty object for null errors', () => {
      expect(service.getErrorParams(null)).toEqual({});
    });

    it('returns error value object as params for minlength', () => {
      expect(service.getErrorParams({ minlength: { requiredLength: 3, actualLength: 1 } }))
        .toEqual({ requiredLength: 3, actualLength: 1 });
    });

    it('returns error value object as params for min', () => {
      expect(service.getErrorParams({ min: { min: 5, actual: 2 } }))
        .toEqual({ min: 5, actual: 2 });
    });

    it('returns empty object when error value is not an object', () => {
      expect(service.getErrorParams({ required: true })).toEqual({});
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { LanguageService } from './language.service';
import { Auth } from './auth';
import { Api } from '../api/api';
import { getSettings, updateSettings } from '../api/functions';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockTransloco: { setActiveLang: ReturnType<typeof vi.fn> };
  let mockApi: { invoke: ReturnType<typeof vi.fn> };
  let store: Record<string, string>;

  const createBlob = (data: unknown) => {
    const blob = Object.create(Blob.prototype);
    Object.defineProperty(blob, 'text', {
      value: () => Promise.resolve(JSON.stringify(data)),
      writable: true,
      configurable: true,
    });
    return blob;
  };

  const setupTestBed = async (platformId: string) => {
    TestBed.resetTestingModule();

    mockTransloco = {
      setActiveLang: vi.fn(),
    };

    mockApi = {
      invoke: vi.fn().mockResolvedValue({}),
    };

    await TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslocoService, useValue: mockTransloco },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: { authReady$: of(true) } },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    service = TestBed.inject(LanguageService);
  };

  beforeAll(() => {
    store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      },
      writable: true,
    });
  });

  beforeEach(async () => {
    store = {};
    vi.clearAllMocks();
    await setupTestBed('browser');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default language to en', () => {
    expect(service.language()).toBe('en');
  });

  describe('initialize', () => {
    it('should default to en when localStorage has no value', async () => {
      mockApi.invoke.mockResolvedValue({ language: 'en_US' });
      service.initialize();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.language()).toBe('en');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('en');
    });

    it('should set language to de when localStorage has de_DE', async () => {
      store['chronoscope-language'] = 'de_DE';
      mockApi.invoke.mockResolvedValue({ language: 'de_DE' });
      service.initialize();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.language()).toBe('de');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('de');
    });

    it('should default to en when localStorage has unknown value', async () => {
      store['chronoscope-language'] = 'fr_FR';
      mockApi.invoke.mockResolvedValue({ language: 'en_US' });
      service.initialize();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.language()).toBe('en');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('en');
    });

    it('should not access localStorage when platform is server', async () => {
      await setupTestBed('server');
      service.initialize();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(window.localStorage.getItem).not.toHaveBeenCalled();
      expect(mockTransloco.setActiveLang).not.toHaveBeenCalled();
      expect(service.language()).toBe('en');
    });
  });

  describe('setLanguage', () => {
    it('should set language, transloco, localStorage, and call API', () => {
      service.setLanguage('de');
      expect(service.language()).toBe('de');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('de');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'chronoscope-language',
        'de_DE',
      );
      expect(mockApi.invoke).toHaveBeenCalledWith(updateSettings, {
        body: { language: 'de_DE' },
      });
    });

    it('should not write localStorage but still call API on server', async () => {
      await setupTestBed('server');
      mockApi.invoke.mockResolvedValue({});
      service.setLanguage('de');
      expect(service.language()).toBe('de');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('de');
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
      expect(mockApi.invoke).toHaveBeenCalledWith(updateSettings, {
        body: { language: 'de_DE' },
      });
    });
  });

  describe('syncFromBackend', () => {
    it('should do nothing when backend returns same language', async () => {
      service.language.set('en');
      mockApi.invoke.mockResolvedValue({ language: 'en_US' });
      await (service as any).syncFromBackend();
      expect(service.language()).toBe('en');
      expect(mockTransloco.setActiveLang).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should update signal, transloco, and localStorage when backend returns different language', async () => {
      service.language.set('en');
      mockApi.invoke.mockResolvedValue({ language: 'de_DE' });
      await (service as any).syncFromBackend();
      expect(service.language()).toBe('de');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('de');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'chronoscope-language',
        'de_DE',
      );
    });

    it('should parse Blob response correctly', async () => {
      service.language.set('en');
      mockApi.invoke.mockResolvedValue(createBlob({ language: 'de_DE' }));
      await (service as any).syncFromBackend();
      expect(service.language()).toBe('de');
      expect(mockTransloco.setActiveLang).toHaveBeenCalledWith('de');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'chronoscope-language',
        'de_DE',
      );
    });

    it('should do nothing when backend returns unknown language', async () => {
      service.language.set('en');
      mockApi.invoke.mockResolvedValue({ language: 'fr_FR' });
      await (service as any).syncFromBackend();
      expect(service.language()).toBe('en');
      expect(mockTransloco.setActiveLang).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should catch API errors silently', async () => {
      service.language.set('en');
      mockApi.invoke.mockRejectedValue(new Error('Network error'));
      await expect((service as any).syncFromBackend()).resolves.toBeUndefined();
      expect(service.language()).toBe('en');
    });

    it('should cast non-Blob response correctly', async () => {
      service.language.set('en');
      mockApi.invoke.mockResolvedValue({ language: 'de_DE' });
      await (service as any).syncFromBackend();
      expect(service.language()).toBe('de');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService, ThemePreference } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockDocument: Document;
  let store: Record<string, string>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
      },
      writable: true,
    });
  });

  beforeEach(async () => {
    TestBed.resetTestingModule();
    mockDocument = document.implementation.createHTMLDocument();
    store = {};

    mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia, writable: true });

    await TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default theme to system', () => {
    expect(service.theme()).toBe('system');
  });

  it('should set theme to light', () => {
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-light');
  });

  it('should set theme to dark', () => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-dark');
  });

  it('should persist theme in localStorage', () => {
    service.setTheme('dark');
    expect(store['chronoscope-theme']).toBe('dark');
  });

  it('should apply theme to element', () => {
    const el = mockDocument.createElement('div');
    service.applyThemeToElement('dark', el);
    expect(el.getAttribute('data-theme')).toBe('chrono-dark');
  });

  it('should track elements with applyCurrentThemeToElement', () => {
    const el = mockDocument.createElement('div');
    const cleanup = service.applyCurrentThemeToElement(el);
    expect(el.getAttribute('data-theme')).toBeTruthy();
    cleanup();
  });

  describe('initialize', () => {
    it('should load saved dark theme from localStorage and apply it', () => {
      store['chronoscope-theme'] = 'dark';
      service.initialize();
      expect(service.theme()).toBe('dark');
      expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-dark');
    });

    it('should default to system when no theme is saved', () => {
      service.initialize();
      expect(service.theme()).toBe('system');
    });

    it('should apply system theme based on system preference when saved theme is system', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      service.initialize();
      expect(service.theme()).toBe('system');
      expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-dark');
    });
  });

  describe('setTheme system', () => {
    it('should set root attribute based on system preference when theme is system', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      service.setTheme('system');
      expect(service.theme()).toBe('system');
      expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-dark');
    });

    it('should register system theme listener when setting theme to system', () => {
      const addEventListener = vi.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      });
      service.setTheme('system');
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove system theme listener when setting theme to non-system', () => {
      const removeEventListener = vi.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener,
      });
      service.setTheme('system');
      service.setTheme('light');
      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('applyThemeToElement with system theme', () => {
    it('should apply chrono-dark when system prefers dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      service.initialize();
      const el = mockDocument.createElement('div');
      service.applyThemeToElement('system', el);
      expect(el.getAttribute('data-theme')).toBe('chrono-dark');
    });

    it('should apply chrono-light when system prefers light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      service.initialize();
      const el = mockDocument.createElement('div');
      service.applyThemeToElement('system', el);
      expect(el.getAttribute('data-theme')).toBe('chrono-light');
    });
  });

  describe('handleSystemThemeChange', () => {
    it('should update systemPrefersDark and root attribute when system theme changes', () => {
      const addEventListener = vi.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      });
      service.setTheme('system');
      expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-light');

      // Simulate system theme change to dark
      const changeHandler = addEventListener.mock.calls[0][1];
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      changeHandler();

      expect(mockDocument.documentElement.getAttribute('data-theme')).toBe('chrono-dark');
    });

    it('should not update when theme is not system', () => {
      const addEventListener = vi.fn();
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      });
      service.setTheme('light');
      expect(addEventListener).not.toHaveBeenCalled();
    });
  });
});

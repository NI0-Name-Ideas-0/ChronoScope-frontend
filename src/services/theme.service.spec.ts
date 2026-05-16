import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService, ThemePreference } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockDocument: Document;
  let store: Record<string, string>;

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
    await TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: mockDocument }],
    }).compileComponents();
    service = TestBed.inject(ThemeService);
    store = {};
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
});

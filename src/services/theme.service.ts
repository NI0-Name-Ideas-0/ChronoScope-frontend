import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'chronoscope-theme';
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQueryList: MediaQueryList | null = null;
  private readonly trackedElements = new Set<Element>();

  readonly theme = signal<ThemePreference>('system');
  private readonly systemPrefersDark = signal<boolean>(false);

  readonly resolvedTheme = computed<'chrono-dark' | 'chrono-light'>(() => {
    const theme = this.theme();
    if (theme === 'system') {
      return this.systemPrefersDark() ? 'chrono-dark' : 'chrono-light';
    }
    return theme === 'dark' ? 'chrono-dark' : 'chrono-light';
  });

  constructor() {
    effect(() => {
      const resolved = this.resolvedTheme();
      this.trackedElements.forEach(el => el.setAttribute('data-theme', resolved));
    });
  }

  initialize() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = window.localStorage.getItem(this.storageKey);
    const nextTheme = this.isThemePreference(savedTheme) ? savedTheme : 'system';

    this.systemPrefersDark.set(this.getSystemPrefersDark());
    this.theme.set(nextTheme);
    this.applyTheme(nextTheme);
    this.syncSystemThemeListener(nextTheme);
  }

  setTheme(theme: ThemePreference) {
    this.theme.set(theme);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
    this.syncSystemThemeListener(theme);
  }

  private applyTheme(theme: ThemePreference) {
    const root = this.document.documentElement;

    if (theme === 'system') {
      const prefersDark = this.getSystemPrefersDark();
      root.setAttribute('data-theme', prefersDark ? 'chrono-dark' : 'chrono-light');
      return;
    }

    const resolvedTheme = theme === 'dark' ? 'chrono-dark' : 'chrono-light';
    root.setAttribute('data-theme', resolvedTheme);
  }

  private syncSystemThemeListener(theme: ThemePreference) {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleSystemThemeChange);
      this.mediaQueryList = null;
    }

    if (theme !== 'system') {
      return;
    }

    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryList.addEventListener('change', this.handleSystemThemeChange);
  }

  applyThemeToElement(theme: ThemePreference, element: Element) {
    let resolved: string;
    if (theme === 'system') {
      resolved = this.systemPrefersDark() ? 'chrono-dark' : 'chrono-light';
    } else {
      resolved = theme === 'dark' ? 'chrono-dark' : 'chrono-light';
    }
    element.setAttribute('data-theme', resolved);
  }

  applyCurrentThemeToElement(element: Element): () => void {
    this.trackedElements.add(element);
    element.setAttribute('data-theme', this.resolvedTheme());
    return () => this.trackedElements.delete(element);
  }

  private handleSystemThemeChange = () => {
    if (this.theme() === 'system') {
      this.systemPrefersDark.set(this.getSystemPrefersDark());
      this.applyTheme('system');
    }
  };

  private getSystemPrefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private isThemePreference(value: string | null): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
  }
}

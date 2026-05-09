import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'chronoscope-theme';
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQueryList: MediaQueryList | null = null;

  readonly theme = signal<ThemePreference>('system');

  initialize() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = window.localStorage.getItem(this.storageKey);
    const nextTheme = this.isThemePreference(savedTheme) ? savedTheme : 'system';

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

  private handleSystemThemeChange = () => {
    if (this.theme() === 'system') {
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

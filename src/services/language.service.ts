import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { filter, firstValueFrom } from 'rxjs';
import { Api } from '../api/api';
import { getSettings, updateSettings } from '../api/functions';
import { SettingsResponse } from '../api/models';
import { Auth } from './auth';

export type AppLocale = 'en' | 'de';

const LOCALE_MAP: Record<AppLocale, string> = { en: 'en_US', de: 'de_DE' };
const REVERSE_MAP: Record<string, AppLocale> = { en_US: 'en', de_DE: 'de' };
const STORAGE_KEY = 'chronoscope-language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly language = signal<AppLocale>('en');

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const locale = stored && REVERSE_MAP[stored] ? REVERSE_MAP[stored] : 'en';

    this.language.set(locale);
    this.transloco.setActiveLang(locale);

    this.syncFromBackend();
  }

  setLanguage(lang: AppLocale): void {
    this.language.set(lang);
    this.transloco.setActiveLang(lang);

    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem(STORAGE_KEY, LOCALE_MAP[lang]);
    }

    this.api.invoke(updateSettings, { body: { language: LOCALE_MAP[lang] } }).catch(() => {});
  }

  private async syncFromBackend(): Promise<void> {
    try {
      await firstValueFrom(this.auth.authReady$.pipe(filter((isReady) => isReady)));
      const response = await this.api.invoke(getSettings, {});

      let parsed: SettingsResponse;
      if (response instanceof Blob) {
        parsed = JSON.parse(await response.text());
      } else {
        parsed = response as SettingsResponse;
      }

      if (parsed.language && REVERSE_MAP[parsed.language]) {
        const backendLocale = REVERSE_MAP[parsed.language];
        if (backendLocale !== this.language()) {
          this.language.set(backendLocale);
          this.transloco.setActiveLang(backendLocale);
          window.localStorage.setItem(STORAGE_KEY, parsed.language);
        }
      }
    } catch {
      // Silently fail — cached localStorage value is already applied
    }
  }
}

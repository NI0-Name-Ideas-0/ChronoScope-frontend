import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemePreference, ThemeService } from '@services/theme.service';

type ThemeOption = ThemePreference;

@Component({
  selector: 'app-settings-appearance',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appearance.html',
  styleUrl: './appearance.css',
})
export class AppearanceSection {
  private readonly themeService = inject(ThemeService);

  readonly themeOptions: { value: ThemeOption; label: string; previewClass: string }[] = [
    { value: 'light', label: 'SETTINGS_APPEARANCE_THEME_LIGHT', previewClass: 'preview-light' },
    { value: 'dark', label: 'SETTINGS_APPEARANCE_THEME_DARK', previewClass: 'preview-dark' },
    { value: 'system', label: 'SETTINGS_APPEARANCE_THEME_SYSTEM', previewClass: 'preview-system' },
  ];

  readonly selectedTheme = this.themeService.theme;

  setTheme(theme: ThemeOption) {
    this.themeService.setTheme(theme);
  }
}

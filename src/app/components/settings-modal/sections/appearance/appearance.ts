import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemePreference, ThemeService } from '@services/theme.service';

type ThemeOption = ThemePreference;

@Component({
  selector: 'app-settings-appearance',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appearance.html',
  styleUrl: './appearance.css',
})
export class AppearanceSection {
  private readonly themeService = inject(ThemeService);

  readonly themeOptions: { value: ThemeOption; label: string; previewClass: string }[] = [
    { value: 'light', label: 'Light', previewClass: 'preview-light' },
    { value: 'dark', label: 'Dark', previewClass: 'preview-dark' },
    { value: 'system', label: 'System', previewClass: 'preview-system' },
  ];

  readonly selectedTheme = this.themeService.theme;

  setTheme(theme: ThemeOption) {
    this.themeService.setTheme(theme);
  }
}

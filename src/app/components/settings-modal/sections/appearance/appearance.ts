import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

type ThemeOption = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-settings-appearance',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appearance.html',
  styleUrl: './appearance.css',
})
export class AppearanceSection {
  readonly themeOptions: { value: ThemeOption; label: string; previewClass: string }[] = [
    { value: 'light', label: 'Light', previewClass: 'preview-light' },
    { value: 'dark', label: 'Dark', previewClass: 'preview-dark' },
    { value: 'system', label: 'System', previewClass: 'preview-system' },
  ];

  selectedTheme = signal<ThemeOption>('system');

  setTheme(theme: ThemeOption) {
    this.selectedTheme.set(theme);
  }
}

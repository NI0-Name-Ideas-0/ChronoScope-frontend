import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

type ThemeOption = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-settings-appearance',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-base-content">Appearance</h2>
        <p class="text-sm text-base-content/60 mt-0.5">Customize how ChronoScope looks for you.</p>
      </div>

      <!-- Theme -->
      <div class="settings-card">
        <h3 class="settings-card-title">Color Theme</h3>
        <p class="settings-card-desc">Choose your preferred color scheme.</p>
        <div class="mt-4 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Color theme">
          @for (option of themeOptions; track option.value) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="selectedTheme() === option.value"
              (click)="setTheme(option.value)"
              class="theme-option-btn"
              [class.theme-option-btn--active]="selectedTheme() === option.value"
            >
              <div class="theme-preview" [class]="option.previewClass">
                <div class="theme-preview-bar"></div>
                <div class="theme-preview-content">
                  <div class="theme-preview-block"></div>
                  <div class="theme-preview-block theme-preview-block--sm"></div>
                </div>
              </div>
              <span class="mt-2 text-sm font-medium text-base-content">{{ option.label }}</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    @reference "../../../../../styles.css";

    .theme-option-btn {
      @apply flex flex-col items-center p-3 rounded-xl border-2 border-base-300 cursor-pointer
             transition-all duration-150 hover:border-primary/50 focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-primary;
    }
    .theme-option-btn--active {
      @apply border-primary bg-primary/5;
    }
    .theme-preview {
      @apply w-full rounded-lg overflow-hidden h-16 flex flex-col;
    }
    .theme-preview-bar {
      @apply h-3 w-full;
    }
    .theme-preview-content {
      @apply flex-1 p-1.5 flex flex-col gap-1;
    }
    .theme-preview-block {
      @apply h-2 rounded w-full;
    }
    .theme-preview-block--sm {
      @apply w-2/3;
    }

    /* Light preview */
    .preview-light {
      @apply bg-white;
    }
    .preview-light .theme-preview-bar { @apply bg-slate-200; }
    .preview-light .theme-preview-block { @apply bg-slate-200; }

    /* Dark preview */
    .preview-dark {
      @apply bg-slate-900;
    }
    .preview-dark .theme-preview-bar { @apply bg-slate-700; }
    .preview-dark .theme-preview-block { @apply bg-slate-700; }

    /* System preview */
    .preview-system {
      background: linear-gradient(135deg, white 50%, #0f172a 50%);
    }
    .preview-system .theme-preview-bar {
      background: linear-gradient(135deg, #e2e8f0 50%, #334155 50%);
    }
    .preview-system .theme-preview-block {
      background: linear-gradient(135deg, #e2e8f0 50%, #334155 50%);
    }
  `,
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

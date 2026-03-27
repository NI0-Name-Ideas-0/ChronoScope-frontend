import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-work-preferences',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-base-content">Work Preferences</h2>
        <p class="text-sm text-base-content/60 mt-0.5">Configure your working hours and scheduling defaults.</p>
      </div>

      <!-- Working hours -->
      <div class="settings-card">
        <h3 class="settings-card-title">Working Hours</h3>
        <p class="settings-card-desc">Set your standard working time to help ChronoScope schedule tasks effectively.</p>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="form-control">
            <span class="label-text text-xs font-medium text-base-content/70 mb-1.5 block">Hours per day</span>
            <div class="input input-bordered flex items-center gap-2 bg-base-100">
              <input
                type="number"
                [(ngModel)]="hoursPerDay"
                min="1"
                max="24"
                class="grow"
                aria-label="Working hours per day"
              />
              <span class="text-base-content/40 text-sm">hrs</span>
            </div>
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-medium text-base-content/70 mb-1.5 block">Hours per week</span>
            <div class="input input-bordered flex items-center gap-2 bg-base-100">
              <input
                type="number"
                [(ngModel)]="hoursPerWeek"
                min="1"
                max="168"
                class="grow"
                aria-label="Working hours per week"
              />
              <span class="text-base-content/40 text-sm">hrs</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Max working time -->
      <div class="settings-card">
        <h3 class="settings-card-title">Maximum Working Time</h3>
        <p class="settings-card-desc">ChronoScope will warn you when scheduled tasks exceed this limit.</p>
        <div class="mt-4 max-w-xs">
          <label class="form-control">
            <span class="label-text text-xs font-medium text-base-content/70 mb-1.5 block">Max hours per day</span>
            <div class="input input-bordered flex items-center gap-2 bg-base-100">
              <input
                type="number"
                [(ngModel)]="maxHoursPerDay"
                min="1"
                max="24"
                class="grow"
                aria-label="Maximum working hours per day"
              />
              <span class="text-base-content/40 text-sm">hrs</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Break settings -->
      <div class="settings-card">
        <h3 class="settings-card-title">Break Settings</h3>
        <p class="settings-card-desc">Define how breaks are scheduled between tasks.</p>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="form-control">
            <span class="label-text text-xs font-medium text-base-content/70 mb-1.5 block">Break duration</span>
            <div class="input input-bordered flex items-center gap-2 bg-base-100">
              <input
                type="number"
                [(ngModel)]="breakDuration"
                min="5"
                max="120"
                step="5"
                class="grow"
                aria-label="Break duration in minutes"
              />
              <span class="text-base-content/40 text-sm">min</span>
            </div>
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-medium text-base-content/70 mb-1.5 block">Break every</span>
            <div class="input input-bordered flex items-center gap-2 bg-base-100">
              <input
                type="number"
                [(ngModel)]="breakInterval"
                min="30"
                max="240"
                step="15"
                class="grow"
                aria-label="Break interval in minutes"
              />
              <span class="text-base-content/40 text-sm">min</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Per-organization preferences -->
      <div class="settings-card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="settings-card-title">Per-Organization Preferences</h3>
            <p class="settings-card-desc">Override these settings individually for each organization.</p>
          </div>
          <label class="flex items-center cursor-pointer gap-2 shrink-0" aria-label="Toggle per-organization preferences">
            <input
              type="checkbox"
              [(ngModel)]="perOrgEnabled"
              class="toggle toggle-primary"
              role="switch"
              [attr.aria-checked]="perOrgEnabled"
            />
          </label>
        </div>
        @if (perOrgEnabled) {
          <div class="mt-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
            Per-organization overrides are <strong>enabled</strong>. Visit each organization's settings to configure them.
          </div>
        }
      </div>

      <div class="flex justify-end">
        <button class="btn btn-primary btn-sm" type="button">Save Preferences</button>
      </div>
    </div>
  `,
})
export class WorkPreferencesSection {
  hoursPerDay = 8;
  hoursPerWeek = 40;
  maxHoursPerDay = 10;
  breakDuration = 15;
  breakInterval = 90;
  perOrgEnabled = false;
}

import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type WorkTimeMode = 'daily' | 'weekly';

const DEFAULT_WORK_PROFILE = {
  workTimeMode: 'daily' as WorkTimeMode,
  hoursPerDay: 8,
  hoursPerWeek: 40,
  maxContinuousWorkMinutes: 90,
  breakCount: 2,
  breakDurationMinutes: 15,
} satisfies { workTimeMode: WorkTimeMode; hoursPerDay: number; hoursPerWeek: number; maxContinuousWorkMinutes: number; breakCount: number; breakDurationMinutes: number };

@Component({
  selector: 'app-settings-work-preferences',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-preferences.html',
})
export class WorkPreferencesSection {
  workTimeMode = signal<WorkTimeMode>(DEFAULT_WORK_PROFILE.workTimeMode);
  hoursPerDay = signal(DEFAULT_WORK_PROFILE.hoursPerDay);
  hoursPerWeek = signal(DEFAULT_WORK_PROFILE.hoursPerWeek);
  maxContinuousWorkMinutes = signal(DEFAULT_WORK_PROFILE.maxContinuousWorkMinutes);
  breakCount = signal(DEFAULT_WORK_PROFILE.breakCount);
  breakDurationMinutes = signal(DEFAULT_WORK_PROFILE.breakDurationMinutes);

  resetToDefaults(): void {
    this.workTimeMode.set(DEFAULT_WORK_PROFILE.workTimeMode);
    this.hoursPerDay.set(DEFAULT_WORK_PROFILE.hoursPerDay);
    this.hoursPerWeek.set(DEFAULT_WORK_PROFILE.hoursPerWeek);
    this.maxContinuousWorkMinutes.set(DEFAULT_WORK_PROFILE.maxContinuousWorkMinutes);
    this.breakCount.set(DEFAULT_WORK_PROFILE.breakCount);
    this.breakDurationMinutes.set(DEFAULT_WORK_PROFILE.breakDurationMinutes);
  }
}

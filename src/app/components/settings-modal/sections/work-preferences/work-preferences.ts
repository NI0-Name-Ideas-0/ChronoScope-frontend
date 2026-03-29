import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-work-preferences',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-preferences.html',
})
export class WorkPreferencesSection {
  hoursPerDay = 8;
  hoursPerWeek = 40;
  maxHoursPerDay = 10;
  breakDuration = 15;
  breakInterval = 90;
  perOrgEnabled = false;
}

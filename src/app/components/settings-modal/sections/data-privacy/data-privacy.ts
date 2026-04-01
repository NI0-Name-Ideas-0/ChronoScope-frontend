import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-settings-data-privacy',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-privacy.html',
})
export class DataPrivacySection {
  showDeleteConfirm = signal(false);
}

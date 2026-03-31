import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-settings-data-privacy',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-privacy.html',
})
export class DataPrivacySection {
  exportRequested = signal(false);
  showDeleteConfirm = signal(false);

  requestExport() {
    this.exportRequested.set(true);
    // Reset after mock delay
    setTimeout(() => this.exportRequested.set(false), 3000);
  }
}

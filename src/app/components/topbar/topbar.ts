import { Component, inject } from '@angular/core';
import { UpcomingBadge } from './upcoming-badge/upcoming-badge';
import { ViewService } from '@services/view.service';

@Component({
  selector: 'app-topbar',
  imports: [UpcomingBadge],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  viewService = inject(ViewService);

  onSearchChange(value: string) {
    this.viewService.searchTask.set(value);
  }

  clearSearch() {
    this.viewService.searchTask.set('');
  }
}

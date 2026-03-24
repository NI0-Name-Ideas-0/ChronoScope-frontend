import { Component } from '@angular/core';
import { UpcomingBadge } from './upcoming-badge/upcoming-badge';

@Component({
  selector: 'app-topbar',
  imports: [UpcomingBadge],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar { }

import { Component, inject } from '@angular/core';
import { Calendar } from './calendar/calendar';
import { ViewService } from '@services/view.service';

@Component({
  selector: 'app-calendar-view',
  imports: [Calendar],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.css',
})
export class CalendarView {
  viewService = inject(ViewService);
}

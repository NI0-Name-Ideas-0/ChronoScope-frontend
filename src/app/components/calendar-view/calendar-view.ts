import { Component, OnInit } from '@angular/core';
import { Calendar } from './calendar/calendar';

@Component({
  selector: 'app-calendar-view',
  imports: [Calendar],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.css',
})
export class CalendarView {}

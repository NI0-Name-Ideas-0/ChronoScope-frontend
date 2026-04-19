import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewService {
  listView: boolean = false;
  calendarView: boolean = true;
}

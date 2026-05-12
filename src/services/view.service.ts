import { Injectable, signal } from '@angular/core';

export interface ActiveFilter {
  type: 'task' | 'label';
  value: string | number;
}

@Injectable({ providedIn: 'root' })
export class ViewService {
  /* 
    Provides the functionality for switching between the diffrent views
  */
  private _listView = true;
  private _calendarView = true;
  searchTask = signal('');
  jumpToDate = signal<Date | null>(null);

  // New search/filter signals
  searchQuery = signal('');
  selectedOrganizationId = signal<string | null>(null);
  activeFilter = signal<ActiveFilter | null>(null);

  get listView(): boolean {
    return this._listView;
  }

  get calendarView(): boolean {
    return this._calendarView;
  }

  toggleList(): void {
    this._listView = !this._listView;
  }

  toggleCalendar(): void {
    this._calendarView = !this._calendarView;
  }

  setListView(value: boolean): void {
    this._listView = value;
  }

  setCalendarView(value: boolean): void {
    this._calendarView = value;
  }
}
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewService {
  /* 
    Provides the functionality for switching between the diffrent views
  */
  private _listView = false;
  private _calendarView = true;

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
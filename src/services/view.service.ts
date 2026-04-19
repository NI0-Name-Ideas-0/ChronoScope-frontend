import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ViewService {
  activeView = signal<'list' | 'calendar'>('calendar');
  
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskModalService {
  /**
   * Opens the dialogue to create a new task.
   */
  private openSubject = new Subject<void>();
  open$ = this.openSubject.asObservable();

  open() {
    this.openSubject.next();
  }
}

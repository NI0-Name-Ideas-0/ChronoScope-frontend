import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { StaticTaskResponse, DynamicTaskResponse } from '../api/models';

export interface ModalOpenEvent {
  task?: StaticTaskResponse | DynamicTaskResponse;
}

@Injectable({ providedIn: 'root' })
export class TaskModalService {
  /**
   * Opens the dialogue to create a new task.
   */
  private openSubject = new Subject<ModalOpenEvent>();
  open$ = this.openSubject.asObservable();

  open() {
    this.openSubject.next({});
  }

  openForEdit(task: StaticTaskResponse | DynamicTaskResponse) {
    this.openSubject.next({ task });
  }
}

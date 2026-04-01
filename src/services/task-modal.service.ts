import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Task } from '../app/model/task';

export interface ModalOpenEvent {
  task?: Task;
  taskIndex?: number;
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

  openForEdit(task: Task, taskIndex: number) {
    this.openSubject.next({ task, taskIndex });
  }
}

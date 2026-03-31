import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../app/model/task';
import { Scope } from '../app/model/scope';
import { EventInput } from '@fullcalendar/core';

@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * Provides Tasks to subscribers
   *
   * @remarks should later be connected to the backend.
   */
  private tasks: Task[] = [];
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  addTask(task: Task): void {
    this.tasks = [...this.tasks, task];
    this.tasksSubject.next(this.tasks);
  }

  toCalendarEvents(task: Task): EventInput[] {
    if (task.scopes.length > 0) {
      return task.scopes.map((scope: Scope) => ({
        title: task.title as string,
        start: scope.start,
        end: scope.end,
      }));
    }
    return [
      {
        title: task.title as string,
        start: task.dueDate,
        allDay: true,
      },
    ];
  }

  getAllCalendarEvents(): EventInput[] {
    return this.tasks.flatMap((task) => this.toCalendarEvents(task));
  }
}

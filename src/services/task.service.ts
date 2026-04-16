import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../app/model/task';
import { StaticTask } from '../app/model/static-task';
import { Scope } from '../app/model/scope';
import { Account } from '../app/model/account';
import { EventInput } from '@fullcalendar/core';

@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * Provides Tasks to subscribers
   *
   * @remarks should later be connected to the backend.
   */
  private tasks: Map<string, Task> = new Map();
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.initMockTasks();
  }

  private initMockTasks(): void {
    const now = new Date();

    this.addTask(
      new StaticTask(
        null,
        'Mock Event',
        'This is a mocked static task',
        [],
        [],
        [
          new Scope(
            new Date(now.getTime() + 1 * 60 * 60 * 1000), // starts in 1 hour
            new Date(now.getTime() + 3 * 60 * 60 * 1000), // ends in 3 hours
          ),
        ],
        new Account(),
        1,
        false,
      ),
    );
  }

  addTask(task: Task): void {
    this.tasks.set(task.id.toString(), task);
    this.tasksSubject.next([...this.tasks.values()]);
  }

  updateTask(task: Task): void {
    this.tasks.set(task.id.toString(), task);
    this.tasksSubject.next([...this.tasks.values()]);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasks(): Task[] {
    return [...this.tasks.values()];
  }

  toCalendarEvents(task: Task): EventInput[] {
    return task.scopes.map((scope: Scope) => ({
      id: task.id.toString(),
      start: scope.start,
      end: scope.end,
    }));
  }

  getAllCalendarEvents(): EventInput[] {
    return this.getTasks().flatMap((task) => this.toCalendarEvents(task));
  }
}

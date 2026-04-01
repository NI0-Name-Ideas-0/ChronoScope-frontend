import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../app/model/task';
import { StaticTask } from '../app/model/static-task';
import { Scope } from '../app/model/scope';
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
        'Mock Event',
        'This is a mocked static task',
        undefined,
        new Date(now.getTime() + 3 * 60 * 60 * 24), // due in 3 days
        [],
        ['mock', 'test'],
        [
          new Scope(
            new Date(now.getTime() + 1 * 60 * 60 * 1000), // starts in 1 hour
            new Date(now.getTime() + 3 * 60 * 60 * 1000), // ends in 3 hours
          ),
        ],
        false,
      ),
    );
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
    this.tasksSubject.next([...this.tasks.values()]);
  }

  updateTask(task: Task): void {
    this.tasks.set(task.id, task);
    this.tasksSubject.next([...this.tasks.values()]);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasks(): Task[] {
    return [...this.tasks.values()];
  }

  toCalendarEvents(task: Task): EventInput[] {
    if (task.scopes.length > 0) {
      return task.scopes.map((scope: Scope) => ({
        id: task.id,
        start: scope.start,
        end: scope.end,
      }));
    }
    return [
      {
        id: task.id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
      },
    ];
  }

  getAllCalendarEvents(): EventInput[] {
    return this.getTasks().flatMap((task) => this.toCalendarEvents(task));
  }
}

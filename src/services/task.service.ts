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
  private tasks: Task[] = [];
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
    this.tasks = [...this.tasks, task];
    this.tasksSubject.next(this.tasks);
  }

  updateTask(index: number, task: Task): void {
    this.tasks = this.tasks.map((t, i) => (i === index ? task : t));
    this.tasksSubject.next(this.tasks);
  }

  getTaskIndex(task: Task): number {
    return this.tasks.indexOf(task);
  }

  getTasks(): Task[] {
    return this.tasks;
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

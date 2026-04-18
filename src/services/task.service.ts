import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../app/model/task';
import { StaticTask } from '../app/model/static-task';
import { Scope } from '../app/model/scope';
import { EventInput } from '@fullcalendar/core';
import { AlgoTask } from '@app/model/algo-task';
import { Api } from '../api/api';
import {
  createTask as createTaskApi,
  CreateTask$Params,
  getTasks as getTasksApi,
  GetTasks$Params,
  getTask as getTaskApi,
  GetTask$Params,
  updateTask as updateTaskApi,
  UpdateTask$Params,
  deleteTask as deleteTaskApi,
  DeleteTask$Params,
} from '../api/functions';
import {
  StaticTaskCreateRequest,
  DynamicTaskCreateRequest,
  StaticTaskResponse,
  DynamicTaskResponse,
  StaticTaskUpdateRequest,
  DynamicTaskUpdateRequest,
} from '../api/models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * Provides Tasks to subscribers
   *
   * @remarks Connected to the backend for real-time task management
   * @remarks Connected accounts are managed by Auth service (auth.ts)
   */
  private tasks: Map<number, Task> = new Map();
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor(private api: Api) {
    this.loadTasks();
  }

  /**
   * Loads all tasks from the backend and updates the subject
   */
  private async loadTasks(): Promise<void> {
    try {
      const params: GetTasks$Params = {};
      const tasks = await this.api.invoke(getTasksApi, params);
      this.tasks.clear();
      tasks.forEach((task) => {
        if (task.id !== undefined) {
          this.tasks.set(task.id, task as any);
        }
      });
      this.tasksSubject.next([...this.tasks.values()]);
    } catch (error) {
      console.error('Error loading tasks from backend:', error);
    }
  }

  /**
   * Creates a new task on the backend
   * @param request The task creation request (StaticTaskCreateRequest or DynamicTaskCreateRequest)
   * @returns Promise with the created task response
   */
  async createTask(
    request: StaticTaskCreateRequest | DynamicTaskCreateRequest,
  ): Promise<StaticTaskResponse | DynamicTaskResponse> {
    const params: CreateTask$Params = {
      body: request,
    };
    const response = await this.api.invoke(createTaskApi, params);
    // Add the newly created task to local cache
    if (response.id !== undefined) {
      this.tasks.set(response.id, response as any);
      this.tasksSubject.next([...this.tasks.values()]);
    }
    return response;
  }

  /**
   * Updates a task on the backend
   * @param id The task ID
   * @param request The update request (StaticTaskUpdateRequest or DynamicTaskUpdateRequest)
   * @returns Promise with the updated task response
   */
  async updateTask(
    id: number,
    request: StaticTaskUpdateRequest | DynamicTaskUpdateRequest,
  ): Promise<StaticTaskResponse | DynamicTaskResponse> {
    const params: UpdateTask$Params = {
      id,
      body: request,
    };
    const response = await this.api.invoke(updateTaskApi, params);
    // Update the task in local cache
    if (response.id !== undefined) {
      this.tasks.set(response.id, response as any);
      this.tasksSubject.next([...this.tasks.values()]);
    }
    return response;
  }

  /**
   * Fetches a single task by ID from the backend
   * @param id The task ID
   * @returns Promise with the task response
   */
  async getTask(id: number): Promise<StaticTaskResponse | DynamicTaskResponse> {
    const params: GetTask$Params = { id };
    const response = await this.api.invoke(getTaskApi, params);
    // Cache the task locally
    if (response.id !== undefined) {
      this.tasks.set(response.id, response as any);
      this.tasksSubject.next([...this.tasks.values()]);
    }
    return response;
  }

  /**
   * Fetches all tasks from the backend
   * @returns Promise with array of task responses
   */
  async getTasks(): Promise<(StaticTaskResponse | DynamicTaskResponse)[]> {
    const params: GetTasks$Params = {};
    const tasks = await this.api.invoke(getTasksApi, params);
    // Update local cache
    this.tasks.clear();
    tasks.forEach((task) => {
      if (task.id !== undefined) {
        this.tasks.set(task.id, task as any);
      }
    });
    this.tasksSubject.next([...this.tasks.values()]);
    return tasks;
  }

  /**
   * Deletes a task from the backend
   * @param id The task ID
   * @returns Promise that resolves when deletion is complete
   */
  async deleteTask(id: number): Promise<void> {
    const params: DeleteTask$Params = { id };
    await this.api.invoke(deleteTaskApi, params);
    // Remove from local cache
    this.tasks.delete(id);
    this.tasksSubject.next([...this.tasks.values()]);
  }

  toCalendarEvents(task: Task): EventInput[] {
    if (task instanceof StaticTask) {
      return [
        {
          id: task.id.toString(),
          start: task.start,
          end: task.end,
        },
      ];
    } else if (task instanceof AlgoTask) {
      return task.scopes.map((scope: Scope) => ({
        id: task.id.toString(),
        start: scope.start,
        end: scope.end,
      }));
    } else {
      throw console.error('Unexpected calendar event received from service');
    }
  }

  getAllCalendarEvents(): EventInput[] {
    return [...this.tasks.values()].flatMap((task: any) => this.toCalendarEvents(task));
  }
}

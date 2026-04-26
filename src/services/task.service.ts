import { Injectable, inject } from '@angular/core';
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
  plan as planApi,
  Plan$Params,
} from '../api/functions';
import {
  StaticTaskCreateRequest,
  DynamicTaskCreateRequest,
  StaticTaskResponse,
  DynamicTaskResponse,
  StaticTaskUpdateRequest,
  DynamicTaskUpdateRequest,
} from '../api/models';
import { OAuthService } from 'angular-oauth2-oidc';
import { Auth } from './auth';

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

  private authService = inject(Auth);

  constructor(
    private api: Api,
    private oauthService: OAuthService,
  ) {
    // Wait for auth to be ready before loading tasks
    this.authService.authReady$.subscribe((isReady) => {
      if (isReady) {
        this.loadTasks();
      }
    });
  }

  /**
   * Loads all tasks from the backend and updates the subject
   */
  async loadTasks(): Promise<void> {
    try {
      const params: GetTasks$Params = {};
      const response = await this.api.invoke(getTasksApi, params);

      // Handle blob response - parse it as JSON if it's a Blob
      let tasks = response;
      if (response instanceof Blob) {
        const jsonText = await response.text();
        tasks = JSON.parse(jsonText);
      }

      // Ensure tasks is an array
      if (!Array.isArray(tasks)) {
        throw new Error('Expected tasks to be an array, got: ' + typeof tasks);
      }

      this.tasks.clear();
      tasks.forEach((apiTask) => {
        if (apiTask.id !== undefined) {
          const modelTask = this.convertApiTaskToModel(apiTask);
          this.tasks.set(apiTask.id, modelTask);
        }
      });
      this.tasksSubject.next([...this.tasks.values()]);
    } catch (error) {
      console.error('Error loading tasks from backend:', error);
    }
  }

  /**
   * Creates a new task on the backend and triggers planning
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

    // Call the plan endpoint after task creation
    try {
      const accountId = request.accountId;
      if (accountId !== undefined) {
        const planParams: Plan$Params = {
          body: { accountId },
        };
        await this.api.invoke(planApi, planParams);
      }
    } catch (error) {
      console.error('Error calling plan endpoint after task creation:', error);
      // Don't throw - the task was created successfully, planning failure shouldn't break task creation
    } finally {
      // Always reload tasks after task creation, whether planning succeeds or fails
      await this.loadTasks();
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
      const modelTask = this.convertApiTaskToModel(response);
      this.tasks.set(response.id, modelTask);
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
      const modelTask = this.convertApiTaskToModel(response);
      this.tasks.set(response.id, modelTask);
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
    const response = await this.api.invoke(getTasksApi, params);

    // Handle blob response - parse it as JSON if it's a Blob
    let tasks = response;
    if (response instanceof Blob) {
      const jsonText = await response.text();
      tasks = JSON.parse(jsonText);
    }

    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      throw new Error('Expected tasks to be an array, got: ' + typeof tasks);
    }

    // Update local cache
    this.tasks.clear();
    tasks.forEach((apiTask) => {
      if (apiTask.id !== undefined) {
        const modelTask = this.convertApiTaskToModel(apiTask);
        this.tasks.set(apiTask.id, modelTask);
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

  /**
   * Converts API response objects to proper Task class instances
   */
  private convertApiTaskToModel(apiTask: StaticTaskResponse | DynamicTaskResponse): Task {
    const isStatic = apiTask.type === 'static' || !('duration' in apiTask);

    if (isStatic) {
      const staticTask = apiTask as StaticTaskResponse;
      return new StaticTask(
        staticTask.id!,
        staticTask.name || '',
        staticTask.description || '',
        [], // dependencies - TODO: resolve actual task dependencies if needed
        (staticTask.labels as any)?.map((l: any) => l.name || l) || [],
        new Date(staticTask.startAt || ''),
        new Date(staticTask.endAt || ''),
        staticTask.accountId || 0,
        staticTask.difficulty || 1,
        false, // isFinished
        staticTask.rrule || '',
      );
    } else {
      const dynamicTask = apiTask as DynamicTaskResponse;
      return new AlgoTask(
        dynamicTask.id!,
        dynamicTask.name || '',
        dynamicTask.description || '',
        new Date(dynamicTask.startAt || ''),
        new Date(dynamicTask.endAt || ''),
        dynamicTask.duration || 0,
        [], // dependencies - TODO: resolve actual task dependencies if needed
        (dynamicTask.labels as any)?.map((l: any) => l.name || l) || [],
        dynamicTask.accountId || 0,
        [], // scopes - these are set by the algorithm
        dynamicTask.difficulty || 1,
        false, // isFinished
        dynamicTask.minScopeDuration || 30,
        dynamicTask.maxScopeDuration || 120,
      );
    }
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

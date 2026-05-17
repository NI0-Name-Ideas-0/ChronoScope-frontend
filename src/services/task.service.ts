import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../app/model/task';
import { StaticTask } from '../app/model/static-task';
import { Scope } from '../app/model/scope';
import { EventInput } from '@fullcalendar/core';
import { AlgoTask } from '@app/model/algo-task';
import { TaskColor } from '@app/model/task';
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
import { Auth } from './auth';
import { rrulestr } from 'rrule';

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

  constructor(private api: Api) {
    // Wait for auth to be ready before loading tasks
    this.authService.authReady$.subscribe((isReady) => {
      if (isReady) {
        this.loadTasks();
      }
    });
  }

  private async parseBlob<T>(response: T): Promise<T> {
    const blob = response as Blob;
    const jsonText = await blob.text();
    return JSON.parse(jsonText) as T;
  }

  private parseDurationToMinutes(duration?: string, fallback: number = 0): number {
    if (!duration) {
      return fallback;
    }

    const numeric = Number(duration);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }

    const isoMatch = duration.match(
      /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
    );

    if (!isoMatch) {
      return fallback;
    }

    const days = Number(isoMatch[1] || 0);
    const hours = Number(isoMatch[2] || 0);
    const minutes = Number(isoMatch[3] || 0);
    const seconds = Number(isoMatch[4] || 0);

    return Math.round(days * 24 * 60 + hours * 60 + minutes + seconds / 60);
  }

  private normalizeTaskColor(color?: TaskColor | string): TaskColor {
    if (!color) {
      return 'UNSET';
    }
    const value = String(color).toUpperCase();
    const allowed: TaskColor[] = [
      'UNSET',
      'RED',
      'ORANGE',
      'AMBER',
      'YELLOW',
      'GREEN',
      'MINT',
      'CYAN',
      'BLUE',
      'INDIGO',
      'PURPLE',
      'PINK',
      'BROWN',
      'GRAY',
    ];
    return (allowed.includes(value as TaskColor) ? value : 'UNSET') as TaskColor;
  }

  private getTaskColorPalette(
    color: TaskColor,
  ): { bg: string; border: string; text: string } | null {
    const palette: Record<TaskColor, { bg: string; border: string; text: string } | null> = {
      UNSET: null,
      RED: { bg: '#ef4444', border: '#ef4444', text: '#991b1b' },
      ORANGE: { bg: '#f97316', border: '#f97316', text: '#9a3412' },
      AMBER: { bg: '#f59e0b', border: '#f59e0b', text: '#92400e' },
      YELLOW: { bg: '#eab308', border: '#eab308', text: '#854d0e' },
      GREEN: { bg: '#22c55e', border: '#22c55e', text: '#166534' },
      MINT: { bg: '#14b8a6', border: '#14b8a6', text: '#0f766e' },
      CYAN: { bg: '#06b6d4', border: '#06b6d4', text: '#0e7490' },
      BLUE: { bg: '#3b82f6', border: '#3b82f6', text: '#1e40af' },
      INDIGO: { bg: '#6366f1', border: '#6366f1', text: '#3730a3' },
      PURPLE: { bg: '#a855f7', border: '#a855f7', text: '#6b21a8' },
      PINK: { bg: '#ec4899', border: '#ec4899', text: '#9d174d' },
      BROWN: { bg: '#a16207', border: '#a16207', text: '#713f12' },
      GRAY: { bg: '#6b7280', border: '#6b7280', text: '#374151' },
    };
    return palette[color];
  }

  getTaskColorStyles(color: TaskColor): { [key: string]: string } {
    const entry = this.getTaskColorPalette(color);
    if (!entry) {
      return {};
    }
    return {
      '--task-color-bg': `color-mix(in srgb, ${entry.bg} 35%, transparent)`,
      '--task-color-border': entry.border,
      '--task-color-text': entry.text,
    };
  }

  /**
   * Formats minutes as an ISO 8601 duration string (e.g. PT30M)
   */
  formatMinutesToDuration(minutes: number): string {
    return `PT${minutes}M`;
  }

  /**
   * Loads all tasks from the backend and updates the subject
   */
  async loadTasks(): Promise<void> {
    try {
      const task_params: GetTasks$Params = {};
      const task_response = await this.api.invoke(getTasksApi, task_params);
      const tasks =
        await this.parseBlob<(StaticTaskResponse | DynamicTaskResponse)[]>(task_response);

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
    const createdTask = await this.parseBlob<StaticTaskResponse | DynamicTaskResponse>(response);

    await this.planAndReload(request.organizationId, 'after task creation');

    return createdTask;
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
    const updatedTask = await this.parseBlob<StaticTaskResponse | DynamicTaskResponse>(response);
    const organizationId = request.organizationId ?? updatedTask.organizationId ?? null;
    await this.planAndReload(organizationId, 'after task update');
    return updatedTask;
  }

  async planTasks(): Promise<void> {
    const identity = this.authService.getIdentityData();
    const organizationIds = (identity?.organizations || [])
      .map((org) => org.id)
      .filter((orgId): orgId is string => !!orgId);

    if (!organizationIds.length) {
      console.warn('Skipping manual plan: no organization IDs available.');
      await this.loadTasks();
      return;
    }

    await this.planOrganizationsAndReload(organizationIds, 'manual plan');
  }

  private async planAndReload(
    organizationId?: string | null,
    contextLabel: string = 'planning',
  ): Promise<void> {
    if (!organizationId) {
      console.warn(`Skipping plan endpoint ${contextLabel}: missing organizationId.`);
      await this.loadTasks();
      return;
    }

    try {
      const planParams: Plan$Params = {
        body: { organizationId: organizationId ?? undefined },
      };
      await this.api.invoke(planApi, planParams);
    } catch (error) {
      console.error(`Error calling plan endpoint ${contextLabel}:`, error);
      // Don't throw - planning failure shouldn't break the caller flow
    } finally {
      // Always reload tasks after planning, whether it succeeds or fails
      await this.loadTasks();
    }
  }

  private async planOrganizationsAndReload(
    organizationIds: string[],
    contextLabel: string = 'planning',
  ): Promise<void> {
    const uniqueOrganizationIds = Array.from(new Set(organizationIds));

    try {
      await Promise.all(
        uniqueOrganizationIds.map((organizationId) => {
          const planParams: Plan$Params = {
            body: { organizationId },
          };
          return this.api.invoke(planApi, planParams);
        }),
      );
    } catch (error) {
      console.error(`Error calling plan endpoint ${contextLabel}:`, error);
      // Don't throw - planning failure shouldn't break the caller flow
    } finally {
      // Always reload tasks after planning, whether it succeeds or fails
      await this.loadTasks();
    }
  }

  /**
   * Fetches a single task by ID from the backend
   * @param id The task ID
   * @returns Promise with the task response
   */
  async getTask(id: number): Promise<StaticTaskResponse | DynamicTaskResponse> {
    const params: GetTask$Params = { id };
    const response = await this.api.invoke(getTaskApi, params);
    const task = await this.parseBlob<StaticTaskResponse | DynamicTaskResponse>(response);
    // Cache the task locally
    if (task.id !== undefined) {
      const modelTask = this.convertApiTaskToModel(task);
      this.tasks.set(task.id, modelTask);
      this.tasksSubject.next([...this.tasks.values()]);
    }
    return task;
  }

  /**
   * Fetches all tasks from the backend
   * @returns Promise with array of task responses
   */
  async getTasks(): Promise<(StaticTaskResponse | DynamicTaskResponse)[]> {
    const task_params: GetTasks$Params = {};
    const task_response = await this.api.invoke(getTasksApi, task_params);
    const tasks = await this.parseBlob<(StaticTaskResponse | DynamicTaskResponse)[]>(task_response);

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
   * Loads completion state from localStorage.
   */
  private loadCompletionState(): Record<number, { isFinished: boolean; scopes: boolean[] }> {
    try {
      return JSON.parse(localStorage.getItem('chronoscope-completion') || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Saves completion state to localStorage.
   */
  saveTaskCompletion(taskId: number, isFinished: boolean, scopeStates?: boolean[]): void {
    const state = this.loadCompletionState();
    state[taskId] = { isFinished, scopes: scopeStates || [] };
    localStorage.setItem('chronoscope-completion', JSON.stringify(state));
    this.tasksSubject.next([...this.tasks.values()]);
  }

  /**
   * Converts API response objects to proper Task class instances
   */
  private convertApiTaskToModel(apiTask: StaticTaskResponse | DynamicTaskResponse): Task {
    const isStatic = apiTask.type === 'static';
    const completionState =
      apiTask.id !== undefined ? this.loadCompletionState()[apiTask.id] : undefined;

    if (isStatic) {
      const staticTask = apiTask as StaticTaskResponse;
      return new StaticTask(
        staticTask.id!,
        staticTask.name!,
        staticTask.description || '',
        (staticTask.labels as any)?.map((l: any) => l.name || l) || [],
        new Scope(new Date(staticTask.startAt!), new Date(staticTask.endAt!)),
        staticTask.organizationId || null,
        staticTask.difficulty!,
        completionState?.isFinished ?? false,
        this.normalizeTaskColor(staticTask.color),
        staticTask.rrule || '',
        Boolean(staticTask.isBlocker),
      );
    } else {
      const dynamicTask = apiTask as DynamicTaskResponse;
      const scopes = (dynamicTask.scopes || [])
        .filter((scope) => scope.startAt && scope.endAt)
        .map((scope, index) => {
          return new Scope(
            new Date(scope.startAt!),
            new Date(scope.endAt!),
            completionState?.scopes?.[index] ?? false,
          );
        });

      const allScopesDone = scopes.length > 0 && scopes.every((s) => s.isFinished);
      return new AlgoTask(
        dynamicTask.id!,
        dynamicTask.name!,
        dynamicTask.description || '',
        new Date(dynamicTask.startAt!),
        new Date(dynamicTask.endAt!),
        this.parseDurationToMinutes(dynamicTask.duration, 0),
        this.parseDurationToMinutes(dynamicTask.elapsed, 0),
        dynamicTask.dependencies,
        (dynamicTask.labels as any)?.map((l: any) => l.name || l) || [],
        dynamicTask.organizationId || null,
        scopes,
        dynamicTask.difficulty!,
        completionState?.isFinished ?? allScopesDone,
        this.normalizeTaskColor(dynamicTask.color),
        this.parseDurationToMinutes(dynamicTask.minScopeDuration, 30),
        this.parseDurationToMinutes(dynamicTask.maxScopeDuration, 120),
      );
    }
  }

  toCalendarEvents(task: Task): EventInput[] {
    if (task instanceof StaticTask) {
      //reaccuring static task with rrule
      if (task.rrule && task.rrule.trim()) {
        try {
          const durationMs = task.scope.end.getTime() - task.scope.start.getTime();
          const hours = Math.floor(durationMs / 3600000);
          const minutes = Math.floor((durationMs % 3600000) / 60000);
          rrulestr(task.rrule);
          return [
            {
              id: task.id.toString(),
              title: task.title,
              rrule: task.rrule,
              duration: { hours, minutes },
              extendedProps: {
                description: task.description,
                difficulty: task.difficulty,
                labels: task.labels,
                isBlocker: task.isBlocker,
                taskType: task.isBlocker ? 'static-blocker' : 'static',
                color: task.color,
              },
            },
          ];
        } catch (e) {
          console.warn('Invalid rrule for task', task.id, task.rrule);
        }
      }

      //normal static task
      return [
        {
          id: task.id.toString(),
          title: task.title,
          start: task.scope.start,
          end: task.scope.end,
          extendedProps: {
            description: task.description,
            difficulty: task.difficulty,
            labels: task.labels,
            isBlocker: task.isBlocker,
            taskType: task.isBlocker ? 'static-blocker' : 'static',
            color: task.color,
          },
        },
      ];
    }

    if (task instanceof AlgoTask) {
      return task.scopes.map((scope: Scope) => ({
        id: `${task.id}-${scope.start.getTime()}`,
        title: task.title,
        start: scope.start,
        end: scope.end,
        extendedProps: {
          description: task.description,
          difficulty: task.difficulty,
          taskType: 'dynamic',
          isDone: scope.isFinished,
          color: task.color,
        },
      }));
    }

    console.error('Unexpected task type', task);
    return [];
  }

  getAllCalendarEvents(): EventInput[] {
    return [...this.tasks.values()].flatMap((task: any) => this.toCalendarEvents(task));
  }

  getAllTasks(): Task[] {
    return [...this.tasks.values()];
  }
}

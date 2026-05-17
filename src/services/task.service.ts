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

      this.cleanupCompletionState(tasks);
      this.cleanupScopeHistory(tasks);

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

    // Clear any stale history for a reused ID so the new task doesn't inherit
    // old scopes from a previously deleted task.
    if (createdTask.id !== undefined) {
      const history = this.loadScopeHistory();
      if (history[createdTask.id]) {
        delete history[createdTask.id];
        this.saveScopeHistory(history);
      }
      const state = this.loadCompletionState();
      if (state[createdTask.id] !== undefined) {
        delete (state as Record<string, unknown>)[createdTask.id.toString()];
        localStorage.setItem('chronoscope-completion', JSON.stringify(state));
      }
    }

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

    this.cleanupCompletionState(tasks);
    this.cleanupScopeHistory(tasks);

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
    // Remove orphaned completion and scope history so a future task with the
    // same ID doesn't inherit stale done-scopes.
    const state = this.loadCompletionState();
    if (state[id] !== undefined) {
      delete (state as Record<string, unknown>)[id.toString()];
      localStorage.setItem('chronoscope-completion', JSON.stringify(state));
    }
    const history = this.loadScopeHistory();
    if (history[id]) {
      delete (history as Record<string, unknown>)[id.toString()];
      this.saveScopeHistory(history);
    }
    this.tasksSubject.next([...this.tasks.values()]);
  }

  /**
   * Removes localStorage completion entries for task IDs that no longer exist
   * in the backend response. This prevents stale data from attaching to new
   * tasks when IDs are reused (e.g. H2 in-memory DB).
   */
  private cleanupCompletionState(tasks: (StaticTaskResponse | DynamicTaskResponse)[]): void {
    const currentIds = new Set(tasks.map((t) => t.id).filter((id): id is number => id !== undefined));
    const state = this.loadCompletionState();
    let changed = false;
    for (const key of Object.keys(state)) {
      const id = Number(key);
      if (!currentIds.has(id)) {
        delete (state as Record<string, unknown>)[key];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem('chronoscope-completion', JSON.stringify(state));
    }
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

    // Sync scope history for dynamic tasks so scope done-states survive replanning.
    const task = this.tasks.get(taskId);
    if (task instanceof AlgoTask) {
      const history = this.loadScopeHistory();
      history[taskId] = task.scopes.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        isFinished: s.isFinished,
      }));
      this.saveScopeHistory(history);
    }

    this.tasksSubject.next([...this.tasks.values()]);
  }

  /**
   * Merges backend scopes with locally stored scope history so that scopes
   * removed by backend replanning remain visible with their done-state.
   * Historical future scopes that don't match a backend scope are only kept
   * if they were finished; past scopes are always preserved.
   */
  private mergeScopesWithHistory(
    taskId: number,
    backendScopes: Scope[],
    completionState?: { isFinished: boolean; scopes: boolean[] },
  ): Scope[] {
    const history = this.loadScopeHistory()[taskId] || [];
    const scopeMap = new Map<string, Scope>();

    for (let i = 0; i < backendScopes.length; i++) {
      const s = backendScopes[i];
      const key = s.start.toISOString();
      const historical = history.find((h) => h.start === key);
      const isFinished = historical?.isFinished ?? completionState?.scopes?.[i] ?? s.isFinished;
      scopeMap.set(key, new Scope(s.start, s.end, isFinished));
    }

    const now = Date.now();
    for (const h of history) {
      if (!scopeMap.has(h.start)) {
        const scopeEnd = new Date(h.end).getTime();
        // Keep historical past scopes (they happened) and finished future scopes.
        if (scopeEnd < now || h.isFinished) {
          scopeMap.set(h.start, new Scope(new Date(h.start), new Date(h.end), h.isFinished));
        }
      }
    }

    return Array.from(scopeMap.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Removes scope-history entries for task IDs that no longer exist.
   */
  private cleanupScopeHistory(tasks: (StaticTaskResponse | DynamicTaskResponse)[]): void {
    const currentIds = new Set(tasks.map((t) => t.id).filter((id): id is number => id !== undefined));
    const history = this.loadScopeHistory();
    let changed = false;
    for (const key of Object.keys(history)) {
      const id = Number(key);
      if (!currentIds.has(id)) {
        delete (history as Record<string, unknown>)[key];
        changed = true;
      }
    }
    if (changed) {
      this.saveScopeHistory(history);
    }
  }

  private loadScopeHistory(): Record<number, Array<{ start: string; end: string; isFinished: boolean }>> {
    try {
      return JSON.parse(localStorage.getItem('chronoscope-scope-history') || '{}');
    } catch {
      return {};
    }
  }

  private saveScopeHistory(
    history: Record<number, Array<{ start: string; end: string; isFinished: boolean }>>,
  ): void {
    localStorage.setItem('chronoscope-scope-history', JSON.stringify(history));
  }

  /**
   * Converts API response objects to proper Task class instances
   */
  private convertApiTaskToModel(apiTask: StaticTaskResponse | DynamicTaskResponse): Task {
    const isStatic = apiTask.type === 'static';
    const completionState = apiTask.id !== undefined ? this.loadCompletionState()[apiTask.id] : undefined;

    if (isStatic) {
      const staticTask = apiTask as StaticTaskResponse;
      const scopeEnd = new Date(staticTask.endAt!);
      const isFinished = scopeEnd.getTime() < Date.now();
      return new StaticTask(
        staticTask.id!,
        staticTask.name!,
        staticTask.description || '',
        (staticTask.labels as any)?.map((l: any) => l.name || l) || [],
        new Scope(new Date(staticTask.startAt!), scopeEnd),
        staticTask.organizationId || null,
        staticTask.difficulty!,
        isFinished,
        staticTask.rrule || '',
        Boolean(staticTask.isBlocker),
      );
    } else {
      const dynamicTask = apiTask as DynamicTaskResponse;
      const backendScopes = (dynamicTask.scopes || [])
        .filter((scope) => scope.startAt && scope.endAt)
        .map((scope) => new Scope(new Date(scope.startAt!), new Date(scope.endAt!)));

      const scopes = this.mergeScopesWithHistory(dynamicTask.id!, backendScopes, completionState);

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

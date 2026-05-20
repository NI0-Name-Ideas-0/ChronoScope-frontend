import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { TaskModalService } from '@services/task-modal.service';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { Task, TaskColor } from '@app/model/task';
import { AlgoTask } from '@app/model/algo-task';
import { RepetitionFieldComponent } from '../repetition-modal/repetition-modal';
import { RRule, rrulestr } from 'rrule';
import {
  StaticTaskCreateRequest,
  DynamicTaskCreateRequest,
  StaticTaskUpdateRequest,
  DynamicTaskUpdateRequest,
  StaticTaskResponse,
  DynamicTaskResponse,
  LabelCreateRequest,
  LabelResponse,
} from '../../../api/models';

// Difficulty level mapping
type Difficulty = 'TRIVIAL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
const DIFFICULTY_LEVELS = ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EXTREME'];
const TASK_COLORS: TaskColor[] = [
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

interface StaticTaskForm {
  title: string;
  description: string;
  labels: string[];
  organizationId: string | undefined;
  difficulty: Difficulty;
  color: TaskColor;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  rrule: string;
  isBlocker: boolean;
}

interface DynamicTaskForm {
  title: string;
  description: string;
  labels: string[];
  organizationId: string | undefined;
  difficulty: Difficulty;
  color: TaskColor;
  startDate: string;
  dueDate: string;
  duration: number;
  minScopeDuration: number;
  maxScopeDuration: number;
  dependencies: Array<any>;
}

type TaskMode = 'static' | 'planned';

@Component({
  selector: 'app-task-modal',
  imports: [FormsModule, AsyncPipe, RepetitionFieldComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-modal.html',
  styleUrl: './task-modal.css',
})
export class TaskModal {
  isOpen = signal(false);
  isLeaving = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  mode: TaskMode = 'static';

  editingTask: StaticTaskResponse | DynamicTaskResponse | null = null;
  get isEditing(): boolean {
    return this.editingTask !== null;
  }

  staticTask: StaticTaskForm;
  dynamicTask: DynamicTaskForm;

  private taskModalService = inject(TaskModalService);
  private taskService = inject(TaskService);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  tasks$ = this.taskService.tasks$;

  constructor() {
    this.staticTask = this.emptyStaticTask();
    this.dynamicTask = this.emptyDynamicTask();

    this.taskModalService.open$.subscribe(({ task }) => {
      if (task !== undefined) {
        this.editingTask = task;
        this.populateFromTask(task);
      } else {
        this.editingTask = null;
        this.staticTask = this.emptyStaticTask();
        this.dynamicTask = this.emptyDynamicTask();
        this.mode = 'static';
      }
      this.errorMessage.set(null);
      this.isOpen.set(true);
      this.cdr.markForCheck();
    });
  }

  emptyStaticTask(): StaticTaskForm {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      title: '',
      description: '',
      labels: [],
      organizationId: undefined,
      difficulty: 'MEDIUM',
      color: 'UNSET',
      startDate: this.formatLocalDate(now),
      startTime: this.formatLocalTime(now),
      endDate: this.formatLocalDate(end),
      endTime: this.formatLocalTime(end),
      rrule: '',
      isBlocker: false,
    };
  }

  emptyDynamicTask(): DynamicTaskForm {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      title: '',
      description: '',
      labels: [],
      organizationId: undefined,
      difficulty: 'MEDIUM',
      color: 'UNSET',
      startDate: this.formatLocalDate(now),
      dueDate: this.formatLocalDate(end),
      duration: 60,
      minScopeDuration: 30,
      maxScopeDuration: 120,
      dependencies: [],
    };
  }

  // Helper: Convert string array of labels to LabelCreateRequest format
  private convertLabelsToRequest(labels: string[]): LabelCreateRequest[] {
    return labels.map((name) => ({ name }));
  }

  // Helper: Convert Date object to ISO 8601 string with timezone
  private dateToISOString(date: Date): string {
    return date.toISOString();
  }

  private minutesToDuration(minutes: number): string {
    return `PT${Math.max(0, Math.round(minutes))}M`;
  }

  private durationToMinutes(duration?: string, fallback: number = 0): number {
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

  // Helper: Combine date and time strings into a Date object
  private stringDateToDate(dateStr: string, timeStr: string = '00:00'): Date {
    return new Date(`${dateStr}T${timeStr}`);
  }

  // Helper: Extract labels from LabelResponse array
  private labelResponseToString(labels?: LabelResponse[]): string[] {
    return (labels || []).map((l) => l.name || '').filter((name) => name);
  }

  // Helper: Determine if a task response is dynamic (by checking for dynamic-specific fields)
  private isDynamicTask(
    task: StaticTaskResponse | DynamicTaskResponse,
  ): task is DynamicTaskResponse {
    return 'duration' in task || 'minScopeDuration' in task;
  }

  private populateFromTask(task: StaticTaskResponse | DynamicTaskResponse): void {
    const baseData = {
      title: task.name || '',
      description: task.description || '',
      labels: this.labelResponseToString(task.labels as LabelResponse[] | undefined),
      organizationId: task.organizationId,
      difficulty: task.difficulty || 1,
      color: (task.color || 'UNSET') as TaskColor,
    };

    if (this.isDynamicTask(task)) {
      this.mode = 'planned';
      const startDate = task.startAt ? task.startAt.split('T')[0] : '';
      const endDate = task.endAt ? task.endAt.split('T')[0] : '';

      this.dynamicTask = {
        ...baseData,
        startDate,
        dueDate: endDate,
        duration: this.durationToMinutes(task.duration, 60),
        minScopeDuration: this.durationToMinutes(task.minScopeDuration, 30),
        maxScopeDuration: this.durationToMinutes(task.maxScopeDuration, 120),
        dependencies: task.dependencies || [],
      } as DynamicTaskForm;
      this.staticTask = this.emptyStaticTask();
    } else {
      this.mode = 'static';
      const startDateTime = task.startAt ? new Date(task.startAt) : null;
      const endDateTime = task.endAt ? new Date(task.endAt) : null;
      const startDate = startDateTime ? this.formatLocalDate(startDateTime) : '';
      const startTime = startDateTime ? this.formatLocalTime(startDateTime) : '00:00';
      const endDate = endDateTime ? this.formatLocalDate(endDateTime) : '';
      const endTime = endDateTime ? this.formatLocalTime(endDateTime) : '00:00';

      this.staticTask = {
        ...baseData,
        startDate,
        startTime,
        endDate,
        endTime,
        rrule: task.rrule || '',
        isBlocker: ('isBlocker' in task && task.isBlocker) || false,
      } as StaticTaskForm;
      if (this.staticTask.isBlocker) {
        this.staticTask.color = 'GRAY';
      }
      this.dynamicTask = this.emptyDynamicTask();
    }
  }

  get currentTask(): StaticTaskForm | DynamicTaskForm {
    return this.mode === 'static' ? this.staticTask : this.dynamicTask;
  }

  get difficultyOptions(): Difficulty[] {
    return DIFFICULTY_LEVELS as Difficulty[];
  }

  get colorOptions(): TaskColor[] {
    return TASK_COLORS;
  }

  setColor(color: TaskColor): void {
    this.currentTask.color = color;
    this.cdr.markForCheck();
  }

  getEffectiveSelectedColor(): TaskColor {
    if (this.currentTask.color !== 'UNSET') {
      return this.currentTask.color;
    }

    return this.taskService.getOrganizationFallbackColor(this.currentTask.organizationId);
  }

  isColorSelected(color: TaskColor): boolean {
    return this.getEffectiveSelectedColor() === color;
  }

  isUnsetSelected(): boolean {
    return this.currentTask.color === 'UNSET' && this.getEffectiveSelectedColor() === 'UNSET';
  }

  get isOrganizationDisabled(): boolean {
    return this.mode === 'static' && this.staticTask.isBlocker === true;
  }

  onBlockerToggle(isBlocker: boolean): void {
    if (isBlocker) {
      if (this.staticTask.organizationId) {
        this.staticTask.organizationId = undefined;
      }
      this.staticTask.color = 'GRAY';
      this.cdr.markForCheck();
      return;
    }
  }

  getDifficultyLabel(value: number): string {
    const level = DIFFICULTY_LEVELS[value];
    return level;
  }

  // Labels
  addLabel(label: string) {
    const trimmed = label.trim();
    const target = this.currentTask;
    if (trimmed && !target.labels.includes(trimmed)) {
      target.labels.push(trimmed);
      this.cdr.markForCheck();
    }
  }

  removeLabel(label: string) {
    this.currentTask.labels = this.currentTask.labels.filter((l) => l !== label);
    this.cdr.markForCheck();
  }

  addDependency(dependencyId: string) {
    const id = Number(dependencyId);
    if (Number.isNaN(id)) return;
    if (!this.dynamicTask.dependencies.includes(id)) {
      this.dynamicTask.dependencies.push(id);
      this.cdr.markForCheck();
    }
  }

  removeDependency(dependencyId: number) {
    this.dynamicTask.dependencies = this.dynamicTask.dependencies.filter(
      (id) => id !== dependencyId,
    );
    this.cdr.markForCheck();
  }

  availableDependencyOptions(tasks: Task[]): Task[] {
    const excluded = new Set<number>(this.dynamicTask.dependencies);
    if (this.isEditing && this.editingTask?.id !== undefined) {
      excluded.add(this.editingTask.id);
    }
    return tasks.filter((task) => task instanceof AlgoTask && !excluded.has(task.id));
  }

  getDependencyLabel(dependencyId: number, tasks: Task[]): string {
    return tasks.find((task) => task.id === dependencyId)?.title || `Task #${dependencyId}`;
  }

  get isValid(): boolean {
    if (!this.currentTask.title.trim()) return false;

    if (this.mode === 'static') {
      const t = this.staticTask;
      if (!t.startDate || !t.endDate) return false;
      if (t.startDate > t.endDate) return false;
      if (t.startDate === t.endDate && t.startTime > t.endTime) return false;
    } else {
      const t = this.dynamicTask;
      if (!t.startDate || !t.dueDate) return false;
      if (t.startDate > t.dueDate) return false;
      if (t.duration < 15 || t.minScopeDuration < 15) return false;
      if (t.maxScopeDuration < t.minScopeDuration) return false;
    }

    return true;
  }

  async submit(): Promise<void> {
    if (!this.isValid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      if (this.mode === 'static') {
        const t = this.staticTask;
        const startDate = this.stringDateToDate(t.startDate, t.startTime);
        const endDate = this.stringDateToDate(t.endDate, t.endTime);
        // Keep rrule DTSTART in sync with the task start date so occurrences
        // reflect the updated time when the user changes start/end dates.
        const rrule = this.syncRruleDtstart(t.rrule, startDate);
        if (this.isEditing && this.editingTask) {
          const request: StaticTaskUpdateRequest = {
            type: 'static',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            difficulty: t.difficulty,
            color: t.isBlocker ? 'GRAY' : t.color,
            organizationId: t.organizationId,
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(endDate),
            rrule,
            isBlocker: t.isBlocker,
          };
          await this.taskService.updateTask(this.editingTask.id!, request);
        } else {
          const request: StaticTaskCreateRequest = {
            type: 'static',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            difficulty: t.difficulty,
            color: t.isBlocker ? 'GRAY' : t.color,
            organizationId: t.organizationId,
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(endDate),
            rrule,
            isBlocker: t.isBlocker,
          };
          await this.taskService.createTask(request);
        }
      } else {
        const t = this.dynamicTask;
        const startDate = this.stringDateToDate(t.startDate);
        const dueDate = this.stringDateToDate(t.dueDate, '23:59');

        if (this.isEditing && this.editingTask) {
          const request: DynamicTaskUpdateRequest = {
            type: 'dynamic',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            difficulty: t.difficulty,
            color: t.color,
            organizationId: t.organizationId,
            duration: this.minutesToDuration(t.duration),
            minScopeDuration: this.minutesToDuration(t.minScopeDuration),
            maxScopeDuration: this.minutesToDuration(t.maxScopeDuration),
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(dueDate),
            dependencies: t.dependencies,
          };

          await this.taskService.updateTask(this.editingTask.id!, request);
        } else {
          const request: DynamicTaskCreateRequest = {
            type: 'dynamic',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            difficulty: t.difficulty,
            color: t.color,
            organizationId: t.organizationId,
            duration: this.minutesToDuration(t.duration),
            minScopeDuration: this.minutesToDuration(t.minScopeDuration),
            maxScopeDuration: this.minutesToDuration(t.maxScopeDuration),
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(dueDate),
            dependencies: t.dependencies,
          };

          await this.taskService.createTask(request);
        }
      }

      this.close();
    } catch (error) {
      console.error('Error submitting task:', error);

      let message = 'Failed to save task. Please check your input and try again.';
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          message = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          message = 'Your session has expired. Please log in again.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          message = 'You do not have permission to save this task.';
        } else if (error.message.includes('400')) {
          message = 'Invalid task data. Please check your input and try again.';
        }
      }

      this.errorMessage.set(message);
    } finally {
      this.isSaving.set(false);
      this.cdr.markForCheck();
    }
  }

  async deleteTask(): Promise<void> {
    if (!this.isEditing || !this.editingTask) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${this.editingTask.name}"?`);
    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      await this.taskService.deleteTask(this.editingTask.id!);
      this.close();
    } catch (error) {
      console.error('Error deleting task:', error);
      this.errorMessage.set('Failed to delete task. Please try again.');
    } finally {
      this.isSaving.set(false);
      this.cdr.markForCheck();
    }
  }
  onRruleChange(rrule: string) {
    this.staticTask.rrule = rrule;
    this.cdr.markForCheck();
  }

  /**
   * Updates the DTSTART of an existing rrule to match a new start date/time.
   * This ensures that when a user changes the task's start/end dates, the
   * recurrence rule occurrences shift accordingly.
   */
  private syncRruleDtstart(rrule: string, newDtstart: Date): string {
    if (!rrule || !rrule.trim()) return rrule;
    try {
      const rule = rrulestr(rrule);
      const newRule = new RRule({ ...rule.origOptions, dtstart: newDtstart });
      return newRule.toString();
    } catch {
      return rrule;
    }
  }

  getTaskStartDate(): Date {
    return this.stringDateToDate(this.staticTask.startDate, this.staticTask.startTime);
  }

  getTaskEndDate(): Date {
    return this.stringDateToDate(this.staticTask.endDate, this.staticTask.endTime);
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatLocalTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  close() {
    this.isLeaving.set(true);
    setTimeout(() => {
      this.isOpen.set(false);
      this.isLeaving.set(false);
    }, 200);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  get Identity() {
    return this.auth.identity$;
  }
}

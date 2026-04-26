import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { TaskModalService } from '../../../services/task-modal.service';
import { TaskService } from '../../../services/task.service';
import { Auth } from '../../../services/auth';
import { formatAccountsForDropdown } from '../../../services/account.utils';
import { RepetitionFieldComponent } from "../repetition-modal/repetition-modal";
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
const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Trivial' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Extreme' },
] as const;

interface StaticTaskForm {
  title: string;
  description: string;
  labels: string[];
  accountId: number;
  difficulty: number;
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
  accountId: number;
  difficulty: number;
  startDate: string;
  dueDate: string;
  duration: number;
  minScopeDuration: number;
  maxScopeDuration: number;
  rrule: string;
  dependencies: Array<any>;
}

type TaskMode = 'static' | 'planned';

@Component({
  selector: 'app-task-modal',
  imports: [FormsModule, RepetitionFieldComponent],
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

  private getDefaultAccountId(): number {
    const accounts = this.auth.getAccounts();
    return accounts.length > 0 ? accounts[0].id! : 0;
  }

  emptyStaticTask(): StaticTaskForm {
    return {
      title: '',
      description: '',
      labels: [],
      accountId: this.getDefaultAccountId(),
      difficulty: 1,
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      rrule: '',
      isBlocker: false,
    };
  }

  emptyDynamicTask(): DynamicTaskForm {
    return {
      title: '',
      description: '',
      labels: [],
      accountId: this.getDefaultAccountId(),
      difficulty: 1,
      startDate: '',
      dueDate: '',
      duration: 60,
      minScopeDuration: 30,
      maxScopeDuration: 120,
      rrule: '',
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
      accountId: task.accountId || this.getDefaultAccountId(),
      difficulty: task.difficulty || 1,
    };

    if (this.isDynamicTask(task)) {
      this.mode = 'planned';
      const startDate = task.startAt ? task.startAt.split('T')[0] : '';
      const endDate = task.endAt ? task.endAt.split('T')[0] : '';

      this.dynamicTask = {
        ...baseData,
        startDate,
        dueDate: endDate,
        duration: task.duration || 60,
        minScopeDuration: task.minScopeDuration || 30,
        maxScopeDuration: task.maxScopeDuration || 120,
        rrule: task.rrule || '',
        dependencies: task.dependencies || [],
      } as DynamicTaskForm;
      this.staticTask = this.emptyStaticTask();
    } else {
      this.mode = 'static';
      const startDate = task.startAt ? task.startAt.split('T')[0] : '';
      const startTime = task.startAt
        ? task.startAt.split('T')[1]?.substring(0, 5) || '00:00'
        : '00:00';
      const endDate = task.endAt ? task.endAt.split('T')[0] : '';
      const endTime = task.endAt ? task.endAt.split('T')[1]?.substring(0, 5) || '00:00' : '00:00';

      this.staticTask = {
        ...baseData,
        startDate,
        startTime,
        endDate,
        endTime,
        rrule: task.rrule || '',
        isBlocker: ('isBlocker' in task && task.isBlocker) || false,
      } as StaticTaskForm;
      this.dynamicTask = this.emptyDynamicTask();
    }
  }

  get currentTask(): StaticTaskForm | DynamicTaskForm {
    return this.mode === 'static' ? this.staticTask : this.dynamicTask;
  }

  get accountOptions(): { id: number; displayName: string }[] {
    return formatAccountsForDropdown(this.auth.getAccounts());
  }

  get difficultyOptions(): typeof DIFFICULTY_LEVELS {
    return DIFFICULTY_LEVELS;
  }

  getDifficultyLabel(value: number): string {
    const level = DIFFICULTY_LEVELS.find((d) => d.value === value);
    return level ? level.label : 'Unknown';
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
      if (t.duration <= 0 || t.minScopeDuration <= 0) return false;
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

        if (this.isEditing && this.editingTask) {
          const request: StaticTaskUpdateRequest = {
            type: 'static',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            difficulty: t.difficulty,
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(endDate),
            rrule: t.rrule,
            isBlocker: t.isBlocker,
          };
          await this.taskService.updateTask(this.editingTask.id!, request);
        } else {
          const request: StaticTaskCreateRequest = {
            type: 'static',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            accountId: t.accountId,
            difficulty: t.difficulty,
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(endDate),
            rrule: t.rrule,
            isBlocker: t.isBlocker,
          };
          await this.taskService.createTask(request);
        }
      } else {
        const t = this.dynamicTask;
        const startDate = this.stringDateToDate(t.startDate);
        const dueDate = this.stringDateToDate(t.dueDate);

        if (this.isEditing && this.editingTask) {
          const request: DynamicTaskUpdateRequest = {
            type: 'dynamic',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            difficulty: t.difficulty,
            duration: t.duration,
            minScopeDuration: t.minScopeDuration,
            maxScopeDuration: t.maxScopeDuration,
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(dueDate),
            rrule: t.rrule,
          };
          await this.taskService.updateTask(this.editingTask.id!, request);
        } else {
          const request: DynamicTaskCreateRequest = {
            type: 'dynamic',
            name: t.title.trim(),
            description: t.description.trim(),
            labels: this.convertLabelsToRequest(t.labels),
            accountId: t.accountId,
            difficulty: t.difficulty,
            duration: t.duration,
            minScopeDuration: t.minScopeDuration,
            maxScopeDuration: t.maxScopeDuration,
            startAt: this.dateToISOString(startDate),
            endAt: this.dateToISOString(dueDate),
            rrule: t.rrule,
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

  onRruleChange(rrule: string) {
  this.staticTask.rrule = rrule;
  this.cdr.markForCheck();
  }

  close() {
    this.isLeaving.set(true);
    setTimeout(() => {
      this.isOpen.set(false);
      this.isLeaving.set(false);
    }, 200);
  }
}

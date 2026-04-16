import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { TaskModalService } from '../../../services/task-modal.service';
import { TaskService } from '../../../services/task.service';
import { Scope } from '../../model/scope';
import { Account } from '../../model/account';
import { StaticTask } from '../../model/static-task';
import { Task } from '../../model/task';
import { AlgoTask } from '../../model/algo-task';

interface ScopeForm {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

interface BaseTaskForm {
  title: string;
  description: string;
  labels: string[];
  account: Account;
  difficulty: number;
}

interface StaticTaskForm extends BaseTaskForm {
  scopes: ScopeForm[];
}

interface AlgoTaskForm extends BaseTaskForm {
  startDate: string;
  dueDate: string;
  minScopeMinutes: number;
  maxScopeMinutes: number;
}

type TaskMode = 'static' | 'planned';

@Component({
  selector: 'app-task-modal',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-modal.html',
  styleUrl: './task-modal.css',
})
export class TaskModal {
  isOpen = signal(false);
  isLeaving = signal(false);
  labelInput = '';
  mode: TaskMode = 'static';
  showScopeWarning = false;
  pendingMode: TaskMode | null = null;

  editingTask: Task | null = null;
  get isEditing(): boolean {
    return this.editingTask !== null;
  }

  staticTask: StaticTaskForm = this.emptyStaticTask();
  algoTask: AlgoTaskForm = this.emptyAlgoTask();

  constructor(
    private taskModalService: TaskModalService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
  ) {
    this.taskModalService.open$.subscribe(({ task }) => {
      this.labelInput = '';
      this.showScopeWarning = false;
      this.pendingMode = null;

      if (task !== undefined) {
        this.editingTask = task;
        this.populateFromTask(task);
      } else {
        this.editingTask = null;
        this.staticTask = this.emptyStaticTask();
        this.algoTask = this.emptyAlgoTask();
        this.mode = 'static';
      }
      this.isOpen.set(true);
      this.cdr.markForCheck();
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatTime(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  private populateFromTask(task: Task): void {
    if (task instanceof AlgoTask) {
      this.mode = 'planned';
      this.algoTask = {
        title: task.title,
        description: task.description,
        startDate: task.startDate ? this.formatDate(task.startDate) : '',
        dueDate: this.formatDate(task.dueDate),
        labels: [...task.labels],
        account: task.account,
        difficulty: task.difficulty,
        minScopeMinutes: task.minScopeMinutes,
        maxScopeMinutes: task.maxScopeMinutes,
      };
      this.staticTask = this.emptyStaticTask();
    } else {
      this.mode = 'static';
      this.staticTask = {
        title: task.title,
        description: task.description,
        labels: [...task.labels],
        account: task.account,
        difficulty: task.difficulty,
        scopes: task.scopes.map((s) => ({
          startDate: this.formatDate(s.start),
          startTime: this.formatTime(s.start),
          endDate: this.formatDate(s.end),
          endTime: this.formatTime(s.end),
        })),
      };
      this.algoTask = this.emptyAlgoTask();
    }
  }

  emptyStaticTask(): StaticTaskForm {
    return {
      title: '',
      description: '',
      labels: [],
      account: Account,
      difficulty: 0,
      scopes: [],
    };
  }

  emptyAlgoTask(): AlgoTaskForm {
    return {
      title: '',
      description: '',
      startDate: '',
      dueDate: '',
      labels: [],
      account: Account,
      minScopeMinutes: 30,
      maxScopeMinutes: 120,
      difficulty: 0,
    };
  }

  get currentTask(): BaseTaskForm {
    return this.mode === 'static' ? this.staticTask : this.algoTask;
  }

  requestSetMode(mode: TaskMode) {
    if (mode === this.mode) return;
    if (this.mode === 'static' && this.staticTask.scopes.length > 0) {
      this.pendingMode = mode;
      this.showScopeWarning = true;
    } else {
      this.applySetMode(mode);
    }
  }

  confirmModeSwitch() {
    if (this.pendingMode) {
      this.staticTask.scopes = [];
      this.applySetMode(this.pendingMode);
    }
    this.showScopeWarning = false;
    this.pendingMode = null;
  }

  cancelModeSwitch() {
    this.showScopeWarning = false;
    this.pendingMode = null;
  }

  private applySetMode(mode: TaskMode) {
    const from = this.currentTask;
    this.mode = mode;
    const to = this.currentTask;
    to.title = from.title;
    to.description = from.description;
    to.labels = [...from.labels];
    this.labelInput = '';
  }

  // Labels
  addLabel() {
    const label = this.labelInput.trim();
    const target = this.currentTask;
    if (label && !target.labels.includes(label)) {
      target.labels.push(label);
    }
    this.labelInput = '';
  }

  removeLabel(label: string) {
    this.currentTask.labels = this.currentTask.labels.filter((l) => l !== label);
  }

  onLabelKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addLabel();
    }
  }

  // Scopes (static only)
  addScope() {
    this.staticTask.scopes.push({ startDate: '', startTime: '', endDate: '', endTime: '' });
  }

  removeScope(index: number) {
    this.staticTask.scopes.splice(index, 1);
  }

  private toDate(date: string, time: string = '00:00'): Date {
    return new Date(`${date}T${time || '00:00'}`);
  }

  private buildScopes(): Scope[] {
    return this.staticTask.scopes
      .filter((s) => s.startDate && s.endDate)
      .map(
        (s) => new Scope(this.toDate(s.startDate, s.startTime), this.toDate(s.endDate, s.endTime)),
      );
  }

  get isValid(): boolean {
    if (!this.currentTask.title.trim()) return false;
    if (this.mode === 'static') {
      const p = this.staticTask;
      if (!p.scopes) return false;
      for (var scope of p.scopes) {
        if (scope.startDate > scope.endDate) return false;
        if (scope.startDate == scope.endDate && scope.startTime > scope.endTime) return false;
      }
    } else if (this.mode === 'planned') {
      const p = this.algoTask;
      return !!p.startDate && p.minScopeMinutes > 0 && p.maxScopeMinutes >= p.minScopeMinutes;
    }
    return true;
  }

  submit() {
    if (!this.isValid) return;

    let task: Task;

    if (this.mode === 'static') {
      const t = this.staticTask;
      task = new StaticTask(
        null,
        t.title.trim(),
        t.description.trim(),
        [],
        t.labels,
        this.buildScopes(),
        t.account,
        t.difficulty,
        false,
      );
    } else {
      const t = this.algoTask;
      task = new AlgoTask(
        null,
        t.title.trim(),
        t.description.trim(),
        this.toDate(t.startDate),
        this.toDate(t.dueDate),
        [],
        t.labels,
        t.account,
        t.difficulty,
        false,
        t.minScopeMinutes,
        t.maxScopeMinutes,
      );
    }

    if (this.isEditing) {
      task.id = this.editingTask!.id;
      this.taskService.updateTask(task);
    } else {
      this.taskService.addTask(task);
    }

    this.close();
  }

  close() {
    this.isLeaving.set(true);
    setTimeout(() => {
      this.isOpen.set(false);
      this.isLeaving.set(false);
    }, 200);
  }
}

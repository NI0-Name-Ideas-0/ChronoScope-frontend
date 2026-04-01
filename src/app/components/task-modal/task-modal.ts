import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { TaskModalService } from '../../../services/task-modal.service';
import { TaskService } from '../../../services/task.service';
import { Scope } from '../../model/scope';
import { Task } from '../../model/task';
import { StaticTask } from '../../model/static-task';
import { AlgoTask, Priority, Difficulty } from '../../model/algo-task';

interface ScopeForm {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

interface BaseTaskForm {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  labels: string[];
}

interface StaticTaskForm extends BaseTaskForm {
  scopes: ScopeForm[];
}

interface AlgoTaskForm extends BaseTaskForm {
  minScopeMinutes: number;
  maxScopeMinutes: number;
  priority: Priority;
  difficulty: Difficulty;
}

type TaskMode = 'static' | 'planned';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-modal.html',
})
export class TaskModal {
  isOpen = false;
  labelInput = '';
  mode: TaskMode = 'static';
  showScopeWarning = false;
  pendingMode: TaskMode | null = null;

  editingIndex: number | null = null;
  get isEditing(): boolean {
    return this.editingIndex !== null;
  }

  staticTask: StaticTaskForm = this.emptyStaticTask();
  algoTask: AlgoTaskForm = this.emptyAlgoTask();

  constructor(
    private taskModalService: TaskModalService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
  ) {
    this.taskModalService.open$.subscribe(() => {
      this.staticTask = this.emptyStaticTask();
      this.algoTask = this.emptyAlgoTask();
      this.labelInput = '';
      this.mode = 'static';
      this.isOpen = true;
      this.cdr.markForCheck();
    });
  }

  emptyStaticTask(): StaticTaskForm {
    return {
      title: '',
      description: '',
      startDate: '',
      dueDate: '',
      labels: [],
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
      minScopeMinutes: 30,
      maxScopeMinutes: 120,
      priority: 'medium',
      difficulty: 'medium',
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
    to.startDate = from.startDate;
    to.dueDate = from.dueDate;
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
    if (!this.currentTask.title.trim() || !this.currentTask.dueDate) return false;
    if (this.mode === 'planned') {
      const p = this.algoTask;
      return !!p.startDate && p.minScopeMinutes > 0 && p.maxScopeMinutes >= p.minScopeMinutes;
    }
    return true;
  }

  submit() {
    if (!this.isValid) return;

    if (this.mode === 'static') {
      const t = this.staticTask;
      this.taskService.addTask(
        new StaticTask(
          t.title.trim(),
          t.description.trim(),
          t.startDate ? this.toDate(t.startDate) : undefined,
          this.toDate(t.dueDate),
          [],
          t.labels,
          this.buildScopes(),
          false,
        ),
      );
    } else {
      const t = this.algoTask;
      this.taskService.addTask(
        new AlgoTask(
          t.title.trim(),
          t.description.trim(),
          this.toDate(t.startDate),
          this.toDate(t.dueDate),
          [],
          t.labels,
          false,
          t.minScopeMinutes,
          t.maxScopeMinutes,
          t.priority,
          t.difficulty,
        ),
      );
    }

    this.close();
  }

  close() {
    this.isOpen = false;
  }
}

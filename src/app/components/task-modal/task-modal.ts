import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskModalService } from '../../../services/task-modal.service';
import { TaskService } from '../../../services/task.service';
import { Task } from '../../model/task';
import { Scope } from '../../model/scope';

interface ScopeForm {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

interface TaskForm {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  labels: string[];
  scopes: ScopeForm[];
}

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-modal.html',
})
export class TaskModal {
  isOpen = false;
  labelInput = '';
  task: TaskForm = this.emptyTask();

  constructor(
    private taskModalService: TaskModalService,
    private taskService: TaskService,
  ) {
    this.taskModalService.open$.subscribe(() => {
      this.task = this.emptyTask();
      this.labelInput = '';
      this.isOpen = true;
    });
  }

  emptyTask(): TaskForm {
    return {
      title: '',
      description: '',
      startDate: '',
      dueDate: '',
      labels: [],
      scopes: [],
    };
  }

  // Labels
  addLabel() {
    const label = this.labelInput.trim();
    if (label && !this.task.labels.includes(label)) {
      this.task.labels.push(label);
    }
    this.labelInput = '';
  }

  removeLabel(label: string) {
    this.task.labels = this.task.labels.filter((l) => l !== label);
  }

  onLabelKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addLabel();
    }
  }

  // Scopes
  addScope() {
    this.task.scopes.push({ startDate: '', startTime: '', endDate: '', endTime: '' });
  }

  removeScope(index: number) {
    this.task.scopes.splice(index, 1);
  }

  private toDate(date: string, time: string): Date {
    return new Date(`${date}T${time || '00:00'}`);
  }

  private buildScopes(): Scope[] {
    return this.task.scopes
      .filter((s) => s.startDate && s.endDate)
      .map(
        (s) => new Scope(this.toDate(s.startDate, s.startTime), this.toDate(s.endDate, s.endTime)),
      );
  }

  submit() {
    if (!this.task.title.trim() || !this.task.dueDate) return;

    const task = new Task(
      this.task.title.trim(),
      this.task.description.trim(),
      this.task.startDate ? this.toDate(this.task.startDate, '') : undefined,
      this.toDate(this.task.dueDate, ''),
      [],
      this.task.labels,
      this.buildScopes(),
    );

    this.taskService.addTask(task);
    this.close();
  }

  close() {
    this.isOpen = false;
  }
}

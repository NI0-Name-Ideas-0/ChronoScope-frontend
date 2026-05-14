import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { TaskService } from '@services/task.service';
import { Task } from '@app/model/task';
import { AlgoTask } from '@app/model/algo-task';
import { StaticTask } from '@app/model/static-task';
import { Scope } from '@app/model/scope';
import { DynamicTaskUpdateRequest } from '@api/models';

@Component({
  selector: 'app-upcoming-badge',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './upcoming-badge.html',
  styleUrl: './upcoming-badge.css',
})
export class UpcomingBadge implements OnInit, OnDestroy {
  constructor(private taskService: TaskService) {}

  private subscriptions = new Subscription();
  private now = signal(new Date());

  currentEntry = signal<UpcomingEntry | null>(null);
  showOverdueModal = signal(false);
  additionalMinutes = signal(15);
  modalError = signal<string | null>(null);
  isSubmitting = signal(false);

  badgeText = computed(() => {
    const entry = this.currentEntry();
    if (!entry) return 'No upcoming tasks';
    return entry.task.title;
  });

  badgeStatusClass = computed(() => {
    const entry = this.currentEntry();
    if (!entry) return 'badge-neutral';
    if (entry.state === 'overdue') return 'badge-error';
    if (entry.state === 'active') return 'badge-success';
    return 'badge-info';
  });

  showCheckmark = computed(() => {
    const entry = this.currentEntry();
    return !!entry && entry.taskType === 'dynamic' && entry.state !== 'upcoming';
  });
  showOverdueAction = computed(() => {
    const entry = this.currentEntry();
    return !!entry && entry.taskType === 'dynamic' && entry.state === 'overdue';
  });

  ngOnInit(): void {
    this.subscriptions.add(
      this.taskService.tasks$.subscribe(() => this.computeUpcoming()),
    );
    this.subscriptions.add(
      interval(30000).subscribe(() => {
        this.now.set(new Date());
        this.computeUpcoming();
      }),
    );
    this.computeUpcoming();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openOverdueModal(): void {
    this.additionalMinutes.set(this.currentScopeMinutes());
    this.modalError.set(null);
    this.showOverdueModal.set(true);
  }

  closeOverdueModal(): void {
    this.showOverdueModal.set(false);
    this.modalError.set(null);
  }

  async markScopeDone(): Promise<void> {
    const entry = this.currentEntry();
    if (!entry || entry.taskType !== 'dynamic') return;

    entry.scope.isFinished = true;
    entry.task.isFinished = entry.task.scopes.every((scope) => scope.isFinished);
    this.taskService.saveTaskCompletion(
      entry.task.id,
      entry.task.isFinished,
      entry.task.scopes.map((scope) => scope.isFinished),
    );

    const newElapsed = this.calculateElapsedMinutes(entry.task);
    await this.submitElapsedUpdate(entry.task, newElapsed);
  }

  async submitOverdue(): Promise<void> {
    const entry = this.currentEntry();
    if (!entry || entry.taskType !== 'dynamic') return;

    const maxAdditional = this.currentScopeMinutes();
    const additional = Math.min(this.additionalMinutes(), maxAdditional);
    if (!Number.isFinite(additional) || additional < 0) {
      this.modalError.set('Please enter a valid number of minutes.');
      return;
    }

    const scopeMinutes = this.scopeDurationMinutes(entry.scope);
    const gainedMinutes = Math.max(scopeMinutes - additional, 0);

    const elapsedMinutes = this.calculateElapsedMinutes(entry.task) + gainedMinutes;
    entry.scope.isFinished = true;
    entry.task.isFinished = entry.task.scopes.every((scope) => scope.isFinished);
    this.taskService.saveTaskCompletion(
      entry.task.id,
      entry.task.isFinished,
      entry.task.scopes.map((scope) => scope.isFinished),
    );

    const newElapsed = Math.min(elapsedMinutes, entry.task.duration);
    await this.submitElapsedUpdate(entry.task, newElapsed);
    this.closeOverdueModal();
  }

  private async submitElapsedUpdate(task: AlgoTask, elapsedMinutes: number): Promise<void> {
    if (this.isSubmitting()) return;

    try {
      this.isSubmitting.set(true);
      const request: DynamicTaskUpdateRequest = {
        type: 'dynamic',
        elapsed: this.minutesToDuration(elapsedMinutes),
        organizationId: task.organizationId || undefined,
      };
      await this.taskService.updateTask(task.id, request);
    } catch (error) {
      console.error('Failed to update task progress:', error);
      this.modalError.set('Failed to update progress. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private minutesToDuration(minutes: number): string {
    return `PT${Math.max(0, Math.round(minutes))}M`;
  }

  private computeUpcoming(): void {
    const tasks = this.taskService.getAllTasks();
    const now = this.now();

    const dynamicQueue: UpcomingDynamicEntry[] = [];
    const staticUpcoming: UpcomingStaticEntry[] = [];

    tasks.forEach((task) => {
      if (task instanceof AlgoTask) {
        const pendingScopes = this.getPendingScopes(task);
        pendingScopes.forEach((scope) => {
          dynamicQueue.push(this.createEntry(task, scope) as UpcomingDynamicEntry);
        });
      } else if (task instanceof StaticTask) {
        staticUpcoming.push(this.createStaticEntry(task) as UpcomingStaticEntry);
      }
    });

    dynamicQueue.sort((a, b) => a.scope.start.getTime() - b.scope.start.getTime());

    const nextDynamic = dynamicQueue.find((entry) => entry.scope.end.getTime() >= now.getTime());
    const dynamicEntry = nextDynamic ?? dynamicQueue[dynamicQueue.length - 1] ?? null;

    if (dynamicEntry && dynamicEntry.scope.end.getTime() < now.getTime()) {
      dynamicEntry.state = 'overdue';
    } else if (dynamicEntry && dynamicEntry.scope.start.getTime() <= now.getTime()) {
      dynamicEntry.state = 'active';
    }

    const staticEntry = staticUpcoming
      .filter((entry) => entry.scope.end.getTime() >= now.getTime())
      .sort((a, b) => a.scope.start.getTime() - b.scope.start.getTime())[0];

    if (!dynamicEntry && staticEntry) {
      this.currentEntry.set(staticEntry);
      return;
    }

    if (dynamicEntry && staticEntry) {
      const dynamicTime = dynamicEntry.scope.start.getTime();
      const staticTime = staticEntry.scope.start.getTime();
      this.currentEntry.set(dynamicTime <= staticTime ? dynamicEntry : staticEntry);
      return;
    }

    this.currentEntry.set(dynamicEntry ?? null);
  }

  private createEntry(task: AlgoTask, scope: Scope): UpcomingEntry {
    const now = this.now();
    let state: UpcomingState = 'upcoming';
    if (scope.start.getTime() <= now.getTime() && scope.end.getTime() >= now.getTime()) {
      state = 'active';
    } else if (scope.end.getTime() < now.getTime()) {
      state = 'overdue';
    }

    return {
      task,
      scope,
      state,
      taskType: 'dynamic',
    };
  }

  private createStaticEntry(task: StaticTask): UpcomingEntry {
    const scope = task.scope;
    const now = this.now();
    let state: UpcomingState = 'upcoming';
    if (scope.start.getTime() <= now.getTime() && scope.end.getTime() >= now.getTime()) {
      state = 'active';
    } else if (scope.end.getTime() < now.getTime()) {
      state = 'overdue';
    }
    return {
      task,
      scope,
      state,
      taskType: 'static',
    };
  }

  private scopeDurationMinutes(scope: Scope): number {
    return Math.max(0, Math.round((scope.end.getTime() - scope.start.getTime()) / 60000));
  }

  currentScopeMinutes(): number {
    const entry = this.currentEntry();
    if (!entry) return 0;
    return this.scopeDurationMinutes(entry.scope);
  }

  clampAdditionalMinutes(value: number): number {
    return Math.min(value, this.currentScopeMinutes());
  }

  private getPendingScopes(task: AlgoTask): Scope[] {
    const scopes = [...task.scopes].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
    if (!scopes.length) return [];

    for (let i = 0; i < scopes.length; i += 1) {
      if (scopes[i].isFinished) {
        continue;
      }
      return scopes.slice(i);
    }

    return [];
  }

  private calculateElapsedMinutes(task: AlgoTask): number {
    return task.scopes
      .filter((scope) => scope.isFinished)
      .reduce((sum, scope) => sum + this.scopeDurationMinutes(scope), 0);
  }
}

type UpcomingState = 'upcoming' | 'active' | 'overdue';

type UpcomingEntry = UpcomingDynamicEntry | UpcomingStaticEntry;

interface UpcomingDynamicEntry {
  task: AlgoTask;
  scope: Scope;
  state: UpcomingState;
  taskType: 'dynamic';
}

interface UpcomingStaticEntry {
  task: StaticTask;
  scope: Scope;
  state: UpcomingState;
  taskType: 'static';
}

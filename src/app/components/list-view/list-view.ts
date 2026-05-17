import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';
import { Task } from '@app/model/task';
import { StaticTask } from '@app/model/static-task';
import { AlgoTask } from '@app/model/algo-task';
import { Scope } from '@app/model/scope';
import { DynamicTaskUpdateRequest } from '../../../api/models';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'list-view.html',
  styleUrl: 'list-view.css',
})
export class ListView implements OnInit {
  constructor(
    private taskService: TaskService,
    private taskModalService: TaskModalService,
    private cdr: ChangeDetectorRef,
  ) {}

  private viewService = inject(ViewService);

  tasks: Task[] = [];
  activeFilter: 'all' | 'todo' | 'today' | 'done' = 'today';

  // Tracks which AlgoTask IDs are expanded
  expandedTasks = new Set<number>();

  get activeFilterDesc(): string {
    const filter = this.viewService.activeFilter();
    if (filter?.type === 'task') return 'task';
    if (filter?.type === 'label') return 'label';
    if (this.viewService.selectedOrganizationId()) return 'organization';
    return '';
  }

  //filters for the automatic Button creation in the .html
  filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Open', value: 'todo' as const },
    { label: 'Today', value: 'today' as const },
    { label: 'Done', value: 'done' as const },
  ];

  ngOnInit(): void {
    this.taskService.tasks$.subscribe((tasks) => {
      this.tasks = tasks;
      this.cdr.detectChanges();
    });
  }

  /**
   * Helper method to get the end/due date of a task
   * Works for both StaticTask and AlgoTask
   */
  getTaskDueDate(task: Task): Date {
    if (task instanceof StaticTask) {
      return task.scope.end;
    } else if (task instanceof AlgoTask) {
      return task.dueDate;
    }
    return new Date(); // fallback
  }

  /**
   * Helper method to check if a task is static
   */
  isStaticTask(task: Task): boolean {
    return task instanceof StaticTask;
  }

  /**
   * Helper method to check if a task is dynamic/algo
   */
  isAlgoTask(task: Task): boolean {
    return task instanceof AlgoTask;
  }

  taskTypeIcon(task: Task): 'static' | 'static-blocker' | 'dynamic' {
    if (task instanceof StaticTask) {
      return task.isBlocker ? 'static-blocker' : 'static';
    }
    if (task instanceof AlgoTask) {
      return 'dynamic';
    }
    return 'static';
  }

  getTaskColorStyle(task: Task): Record<string, string> {
    const color = task.color || 'UNSET';
    const base = this.taskService.getTaskColorStyles(color);
    if (!base['--task-color-bg']) {
      return {};
    }

    const tintBase = base['--task-color-border'] || base['--task-color-text'];

    return {
      '--task-tint': tintBase
        ? `color-mix(in srgb, ${tintBase} 18%, transparent)`
        : base['--task-color-bg'],
      '--task-tint-border': base['--task-color-border'],
      '--task-tint-text': base['--task-color-text'],
    } as Record<string, string>;
  }

  onSearchChange() {}
  /**
   * Returns the duration of a scope in minutes
   */
  getScopeDurationMinutes(scope: Scope): number {
    return Math.round((scope.end.getTime() - scope.start.getTime()) / 60000);
  }

  /**
   * Calculates total elapsed minutes for finished scopes of an AlgoTask
   */
  calculateElapsedMinutes(task: AlgoTask): number {
    return task.scopes
      .filter((s) => s.isFinished)
      .reduce((sum, s) => sum + this.getScopeDurationMinutes(s), 0);
  }

  /**
   * Toggles expansion of an AlgoTask to show/hide its scopes
   */
  toggleExpand(task: Task, event: Event) {
    event.stopPropagation();
    if (this.expandedTasks.has(task.id)) {
      this.expandedTasks.delete(task.id);
    } else {
      this.expandedTasks.add(task.id);
    }
    this.cdr.detectChanges();
  }

  /**
   * Checks if an AlgoTask is currently expanded
   */
  isExpanded(task: Task): boolean {
    return this.expandedTasks.has(task.id);
  }

  /**
   * Returns the completion ratio of an AlgoTask (0 to 1)
   */
  getCompletionRatio(task: AlgoTask): number {
    if (task.scopes.length === 0) return 0;
    const doneScopes = task.scopes.filter((s) => s.isFinished).length;
    return doneScopes / task.scopes.length;
  }

  /**
   * Returns the scopes to display for an AlgoTask.
   * In 'today' view only scopes that fall on today are shown.
   */
  getVisibleScopes(task: AlgoTask): Scope[] {
    if (this.activeFilter !== 'today') {
      return task.scopes;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return task.scopes.filter((scope) => {
      const scopeDate = new Date(scope.start);
      scopeDate.setHours(0, 0, 0, 0);
      return scopeDate.getTime() === today.getTime();
    });
  }

  //used by the Filter-Buttons to set the value
  setFilter(filterValue: 'todo' | 'today' | 'done' | 'all') {
    this.activeFilter = filterValue;
  }

  //used for creating the List-View with the diffrent filter values, default is the unfiltered List
  filteringTasks(): Task[] {
    let result = this.tasks;

    // Apply organization filter
    const orgId = this.viewService.selectedOrganizationId();
    if (orgId) {
      result = result.filter((task) => task.organizationId === orgId);
    }

    // Apply active filter (task or label)
    const activeFilter = this.viewService.activeFilter();
    if (activeFilter) {
      if (activeFilter.type === 'task') {
        result = result.filter((task) => task.id === activeFilter.value);
      } else if (activeFilter.type === 'label') {
        result = result.filter((task) => task.labels?.includes(activeFilter.value as string));
      }
    }

    switch (this.activeFilter) {
      case 'todo':
        result = result.filter((task) => !this.isTaskFinished(task));
        break;
      case 'done':
        result = result.filter((task) => this.isTaskFinished(task));
        break;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        result = result.filter((task) => {
          if (task instanceof StaticTask) {
            const due = new Date(task.scope.end);
            due.setHours(0, 0, 0, 0);
            return due.getTime() === today.getTime();
          } else if (task instanceof AlgoTask) {
            return task.scopes.some((scope) => {
              const scopeDate = new Date(scope.start);
              scopeDate.setHours(0, 0, 0, 0);
              return scopeDate.getTime() === today.getTime();
            });
          }
          return false;
        });
        break;
      default:
        break;
    }

    return result;
  }

  /**
   * Checks if a task is finished.
   * For AlgoTasks, returns true only when ALL scopes are finished.
   */
  isTaskFinished(task: Task): boolean {
    if (task instanceof AlgoTask) {
      return task.scopes.length > 0 && task.scopes.every((s) => s.isFinished);
    }
    return task.isFinished;
  }

  //returns the overall number of open tasks
  openCount(): number {
    return this.tasks.filter((task) => !this.isTaskFinished(task)).length;
  }

  //returns the overall number of done tasks
  doneCount(): number {
    return this.tasks.filter((task) => this.isTaskFinished(task)).length;
  }

  onTaskClick(task: Task) {
    // Fetch the full task from the service and open for editing
    this.taskService.getTask(task.id).then((apiTask) => {
      this.taskModalService.openForEdit(apiTask);
    });
  }

  onMarkDone(task: Task, event: Event) {
    event.stopPropagation();
    task.isFinished = !task.isFinished;
    this.taskService.saveTaskCompletion(task.id, task.isFinished);
    this.cdr.detectChanges();
  }

  onMarkScopeDone(task: AlgoTask, scope: Scope, event: Event) {
    event.stopPropagation();
    scope.isFinished = !scope.isFinished;

    // Derive task-level completion from all scopes
    task.isFinished = task.scopes.every((s) => s.isFinished);

    // Persist completion state locally so it survives reloads
    this.taskService.saveTaskCompletion(
      task.id,
      task.isFinished,
      task.scopes.map((s) => s.isFinished),
    );

    // Calculate elapsed time from finished scopes and send to backend
    const elapsedMinutes = this.calculateElapsedMinutes(task);
    const updateRequest: DynamicTaskUpdateRequest = {
      type: 'dynamic',
      elapsed: this.taskService.formatMinutesToDuration(elapsedMinutes),
    };
    this.taskService
      .updateTask(task.id, updateRequest)
      .catch((error) => console.error('Error updating elapsed time:', error));

    this.cdr.detectChanges();
  }

  async onDelete(task: Task, event: Event) {
    event.stopPropagation();
    // Confirm deletion before proceeding
    const confirmed = window.confirm(`Are you sure you want to delete "${task.title}"?`);
    if (confirmed) {
      try {
        await this.taskService.deleteTask(task.id);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  }
}

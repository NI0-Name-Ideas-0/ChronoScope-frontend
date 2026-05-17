import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { UpcomingBadge } from './upcoming-badge/upcoming-badge';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { Task } from '@app/model/task';
import { StaticTask } from '@app/model/static-task';
import { AlgoTask } from '@app/model/algo-task';
import { Organization } from '../../../api/models/organization';

interface PreviewItem {
  type: 'task' | 'label';
  id?: number;
  title: string;
}

@Component({
  selector: 'app-topbar',
  imports: [UpcomingBadge, CommonModule, TranslocoPipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar implements OnInit, OnDestroy {
  viewService = inject(ViewService);
  private taskService = inject(TaskService);
  private auth = inject(Auth);
  private elementRef = inject(ElementRef);

  isDropdownOpen = signal(false);
  tasks = signal<Task[]>([]);
  organizations = signal<Organization[]>([]);

  previewItems = computed(() => {
    const query = this.viewService.searchQuery().toLowerCase().trim();
    if (!query) return [];

    const currentTasks = this.tasks();
    const orgFilter = this.viewService.selectedOrganizationId();

    let filteredTasks = currentTasks;
    if (orgFilter) {
      filteredTasks = filteredTasks.filter((t) => t.organizationId === orgFilter);
    }

    const matchingTasks = filteredTasks
      .filter((t) => t.title.toLowerCase().includes(query))
      .slice(0, 5)
      .map((t) => ({ type: 'task' as const, id: t.id, title: t.title }));

    const allLabels = new Set<string>();
    filteredTasks.forEach((t) => t.labels?.forEach((l) => allLabels.add(l)));
    const matchingLabels = [...allLabels]
      .filter((l) => l.toLowerCase().includes(query))
      .slice(0, 5)
      .map((l) => ({ type: 'label' as const, title: l }));

    return [...matchingTasks, ...matchingLabels];
  });

  ngOnInit(): void {
    this.taskService.tasks$.subscribe((tasks) => {
      this.tasks.set(tasks);
    });

    this.auth.identity$.subscribe((identity) => {
      if (identity?.organizations) {
        this.organizations.set(identity.organizations);
      }
    });

    document.addEventListener('mousedown', this.onDocumentClick);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.onDocumentClick);
  }

  private onDocumentClick = (event: MouseEvent) => {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  };

  onSearchInput(value: string) {
    this.viewService.searchQuery.set(value);
    this.viewService.activeFilter.set(null);
    this.viewService.searchTask.set('');
  }

  onFocus() {
    this.isDropdownOpen.set(true);
  }

  selectOrganization(orgId: string | null) {
    this.viewService.selectedOrganizationId.set(orgId);
  }

  selectPreviewItem(item: PreviewItem) {
    if (item.type === 'task' && item.id !== undefined) {
      this.viewService.activeFilter.set({ type: 'task', value: item.id });
      const task = this.tasks().find((t) => t.id === item.id);
      if (task instanceof StaticTask) {
        this.viewService.jumpToDate.set(task.scope.start);
      } else if (task instanceof AlgoTask) {
        const firstOpenScope = task.scopes.find((s) => !s.isFinished);
        this.viewService.jumpToDate.set(firstOpenScope?.start ?? task.dueDate);
      }
    } else if (item.type === 'label') {
      this.viewService.activeFilter.set({ type: 'label', value: item.title });
    }
    this.viewService.searchQuery.set(item.title);
    this.isDropdownOpen.set(false);
  }

  clearSearch() {
    this.viewService.searchQuery.set('');
    this.viewService.searchTask.set('');
    this.viewService.selectedOrganizationId.set(null);
    this.viewService.activeFilter.set(null);
    this.isDropdownOpen.set(false);
  }

  hasActiveFilters(): boolean {
    return (
      !!this.viewService.searchQuery() ||
      !!this.viewService.selectedOrganizationId() ||
      !!this.viewService.activeFilter()
    );
  }
}

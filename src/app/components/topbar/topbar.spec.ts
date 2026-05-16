import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topbar } from './topbar';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Task } from '@app/model/task';

class MockTaskService {
  tasks$ = new BehaviorSubject<Task[]>([]);
}

class MockAuth {
  identity$ = of({ organizations: [{ id: 'org-1', name: 'Chrono Labs' }] });
}

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let viewService: ViewService;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        ViewService,
        { provide: TaskService, useClass: MockTaskService },
        { provide: Auth, useClass: MockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    viewService = TestBed.inject(ViewService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update viewService searchQuery on input', () => {
    component.onSearchInput('Test query');
    expect(viewService.searchQuery()).toBe('Test query');
  });

  it('should clear all filters when clearSearch is called', () => {
    viewService.searchQuery.set('Test query');
    viewService.selectedOrganizationId.set('org-1');
    viewService.activeFilter.set({ type: 'label', value: 'work' });

    component.clearSearch();

    expect(viewService.searchQuery()).toBe('');
    expect(viewService.selectedOrganizationId()).toBeNull();
    expect(viewService.activeFilter()).toBeNull();
  });

  it('should not show clear button when no filters are active', () => {
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should show clear button when filters are active', () => {
    viewService.searchQuery.set('query');
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should open dropdown on focus', () => {
    expect(component.isDropdownOpen()).toBe(false);
    component.onFocus();
    expect(component.isDropdownOpen()).toBe(true);
  });

  it('should select organization', () => {
    component.selectOrganization('org-1');
    expect(viewService.selectedOrganizationId()).toBe('org-1');
  });

  it('should select preview item for task', () => {
    const taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    const task = { id: 1, title: 'Test', scope: { start: new Date() }, scopes: [] } as any;
    taskService.tasks$.next([task]);

    component.selectPreviewItem({ type: 'task', id: 1, title: 'Test' });
    expect(viewService.activeFilter()).toEqual({ type: 'task', value: 1 });
  });

  it('should select preview item for label', () => {
    component.selectPreviewItem({ type: 'label', title: 'work' });
    expect(viewService.activeFilter()).toEqual({ type: 'label', value: 'work' });
  });
});

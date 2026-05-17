import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topbar } from './topbar';
import { ViewService } from '@services/view.service';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Task } from '@app/model/task';
import { AlgoTask } from '@app/model/algo-task';
import { Scope } from '@app/model/scope';

class MockTaskService {
  tasks$ = new BehaviorSubject<Task[]>([]);
  getAllTasks = vi.fn().mockReturnValue([]);
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
      imports: [Topbar, getTranslocoTestingModule()],
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

  // --- previewItems ---
  it('should return empty previewItems when query is empty', () => {
    viewService.searchQuery.set('');
    expect(component.previewItems()).toEqual([]);
  });

  it('should filter previewItems by selected organization', () => {
    const taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    taskService.tasks$.next([
      { id: 1, title: 'Org1 Task', labels: [], organizationId: 'org-1' } as any,
      { id: 2, title: 'Org2 Task', labels: [], organizationId: 'org-2' } as any,
    ]);

    viewService.searchQuery.set('Task');
    component.selectOrganization('org-1');

    const items = component.previewItems();
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('task');
    expect((items[0] as any).id).toBe(1);
  });

  it('should include matching tasks and labels in previewItems', () => {
    const taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    taskService.tasks$.next([
      { id: 1, title: 'work task', labels: ['work'], organizationId: 'org-1' } as any,
      { id: 2, title: 'personal task', labels: ['personal'], organizationId: 'org-1' } as any,
    ]);

    viewService.searchQuery.set('work');

    const items = component.previewItems();
    const taskItems = items.filter((i) => i.type === 'task');
    const labelItems = items.filter((i) => i.type === 'label');

    expect(taskItems.length).toBe(1);
    expect(taskItems[0].id).toBe(1);
    expect(labelItems.length).toBe(1);
    expect(labelItems[0].title).toBe('work');
  });

  // --- ngOnInit ---
  it('should populate tasks and organizations from subscriptions on ngOnInit', () => {
    const taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    taskService.tasks$.next([{ id: 1, title: 'Task 1', labels: [], organizationId: 'org-1' } as any]);

    expect(component.tasks().length).toBe(1);
    expect(component.tasks()[0].title).toBe('Task 1');
    expect(component.organizations().length).toBe(1);
    expect(component.organizations()[0].name).toBe('Chrono Labs');
  });

  // --- onDocumentClick ---
  it('should close dropdown when clicking outside', () => {
    component.onFocus();
    expect(component.isDropdownOpen()).toBe(true);

    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideEl.dispatchEvent(event);

    expect(component.isDropdownOpen()).toBe(false);
    document.body.removeChild(outsideEl);
  });

  // --- selectPreviewItem with AlgoTask ---
  it('should set jumpToDate to first open scope for AlgoTask', () => {
    const taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    const openScope = new Scope(new Date('2026-06-01'), new Date('2026-06-02'));
    const finishedScope = new Scope(new Date('2026-05-01'), new Date('2026-05-02'), true);
    const algoTask = new AlgoTask(
      1,
      'Algo Task',
      '',
      new Date(),
      new Date(),
      5,
      0,
      [],
      [],
      'org-1',
      [finishedScope, openScope],
      'easy',
      false,
      'UNSET',
      30,
      60,
    );

    taskService.tasks$.next([algoTask]);

    component.selectPreviewItem({ type: 'task', id: 1, title: 'Algo Task' });

    expect(viewService.activeFilter()).toEqual({ type: 'task', value: 1 });
    expect(viewService.jumpToDate()).toEqual(openScope.start);
  });

  // --- Template branches ---
  it('should render template branches correctly', () => {
    // Dropdown closed
    expect(fixture.nativeElement.querySelector('.z-50')).toBeFalsy();

    // Open dropdown
    component.onFocus();
    fixture.detectChanges();
    const dropdown = fixture.nativeElement.querySelector('.z-50');
    expect(dropdown).toBeTruthy();

    // Organization buttons rendered
    expect(dropdown.querySelectorAll('button').length).toBeGreaterThan(0);

    // With preview items
    const taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    taskService.tasks$.next([{ id: 1, title: 'search item', labels: [], organizationId: 'org-1' } as any]);
    viewService.searchQuery.set('search');
    fixture.detectChanges();
    expect(dropdown.querySelectorAll('button').length).toBeGreaterThan(1);

    // No matches state
    viewService.searchQuery.set('nomatch');
    fixture.detectChanges();
    expect(dropdown.textContent).toContain('No matches found');

    // Clear button with active filters
    viewService.searchQuery.set('');
    viewService.activeFilter.set({ type: 'label', value: 'work' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[title="Clear search"]')).toBeTruthy();
  });
});

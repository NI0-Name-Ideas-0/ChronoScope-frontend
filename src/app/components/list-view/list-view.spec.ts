import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListView } from './list-view';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../api/api';
import { Auth } from '@services/auth';
import { BehaviorSubject } from 'rxjs';
import { StaticTask } from '@app/model/static-task';
import { AlgoTask } from '@app/model/algo-task';
import { Scope } from '@app/model/scope';
import { Task } from '@app/model/task';

describe('ListView', () => {
  let component: ListView;
  let fixture: ComponentFixture<ListView>;
  let taskService: TaskService;

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
  };

  const mockApi = {
    invoke: vi.fn(),
  };

  const mockAuth = {
    authReady$: {
      subscribe: vi.fn(),
    },
    getAccounts: vi.fn().mockReturnValue([]),
  };

  const createMockTask = (id: number, title: string, isFinished: boolean = false): Task => {
    return new StaticTask(
      id,
      title,
      'Description',
      [],
      new Scope(new Date('2026-05-10'), new Date('2026-05-10')),
      null,
      'EASY',
      isFinished,
    );
  };

  const createMockAlgoTask = (
    id: number,
    title: string,
    scopes: Scope[] = [],
    isFinished: boolean = false,
  ): Task => {
    return new AlgoTask(
      id,
      title,
      'Description',
      new Date('2026-05-10'),
      new Date('2026-05-10'),
      120,
      [],
      [],
      null,
      scopes,
      'EASY',
      isFinished,
      30,
      120,
    );
  };

  const mockTaskService = {
    tasks$: new BehaviorSubject<Task[]>([]),
    getTask: vi.fn(),
    deleteTask: vi.fn(),
    updateTask: vi.fn().mockResolvedValue({}),
    formatMinutesToDuration: vi.fn((m: number) => `PT${m}M`),
    saveTaskCompletion: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListView],
      providers: [
        TaskModalService,
        { provide: TaskService, useValue: mockTaskService },
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListView);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render tasks from the task service', () => {
    const tasks = [createMockTask(1, 'Task 1'), createMockTask(2, 'Task 2')];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const taskCards = fixture.nativeElement.querySelectorAll('.card');
    expect(taskCards.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Task 1');
    expect(fixture.nativeElement.textContent).toContain('Task 2');
  });

  describe('StaticTask', () => {
    it('should display mark-as-done buttons for static tasks', () => {
      const tasks = [createMockTask(1, 'Task 1'), createMockTask(2, 'Task 2')];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[title="Mark as done"]');
      expect(buttons.length).toBe(2);
    });

    it('should mark a static task as done when the button is clicked', () => {
      const tasks = [createMockTask(1, 'Task 1')];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const markDoneButton = fixture.nativeElement.querySelector('button[title="Mark as done"]');
      expect(tasks[0].isFinished).toBe(false);

      markDoneButton.click();
      fixture.detectChanges();

      expect(tasks[0].isFinished).toBe(true);
    });

    it('should mark a done static task as open when the button is clicked again', () => {
      const tasks = [createMockTask(1, 'Task 1', true)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const markOpenButton = fixture.nativeElement.querySelector('button[title="Mark as open"]');
      expect(tasks[0].isFinished).toBe(true);

      markOpenButton.click();
      fixture.detectChanges();

      expect(tasks[0].isFinished).toBe(false);
    });

    it('should apply text-warning class to the button when static task is open', () => {
      const tasks = [createMockTask(1, 'Task 1', false)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[title="Mark as done"]');
      expect(button.classList.contains('text-warning')).toBe(true);
      expect(button.classList.contains('text-success')).toBe(false);
    });

    it('should apply text-success class to the button when static task is finished', () => {
      const tasks = [createMockTask(1, 'Task 1', true)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[title="Mark as open"]');
      expect(button.classList.contains('text-success')).toBe(true);
      expect(button.classList.contains('text-warning')).toBe(false);
    });

    it('should apply task-done class to finished static tasks', () => {
      const tasks = [createMockTask(1, 'Done Task', true)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.card');
      expect(card.classList.contains('task-done')).toBe(true);
    });

    it('should not apply task-done class to open static tasks', () => {
      const tasks = [createMockTask(1, 'Open Task', false)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.card');
      expect(card.classList.contains('task-done')).toBe(false);
    });

    it('should toggle task-done class when mark-as-done is clicked on static task', () => {
      const tasks = [createMockTask(1, 'Task 1', false)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.card');
      const markDoneButton = fixture.nativeElement.querySelector('button[title="Mark as done"]');

      expect(card.classList.contains('task-done')).toBe(false);

      markDoneButton.click();
      fixture.detectChanges();

      expect(card.classList.contains('task-done')).toBe(true);

      markDoneButton.click();
      fixture.detectChanges();

      expect(card.classList.contains('task-done')).toBe(false);
    });
  });

  describe('AlgoTask', () => {
    it('should not show task-level mark-as-done button for algo tasks', () => {
      const tasks = [createMockAlgoTask(1, 'Algo Task 1')];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[title="Mark as done"]');
      expect(buttons.length).toBe(0);
    });

    it('should show expand button for algo tasks', () => {
      const tasks = [createMockAlgoTask(1, 'Algo Task 1')];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const expandButton = fixture.nativeElement.querySelector('.expand-btn');
      expect(expandButton).toBeTruthy();
    });

    it('should expand and show scopes when expand button is clicked', () => {
      const scopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00')),
        new Scope(new Date('2026-05-10T14:00'), new Date('2026-05-10T15:00')),
      ];
      const tasks = [createMockAlgoTask(1, 'Algo Task 1', scopes)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      expect(component.isExpanded(tasks[0])).toBe(false);

      const expandButton = fixture.nativeElement.querySelector('.expand-btn');
      expandButton.click();
      fixture.detectChanges();

      expect(component.isExpanded(tasks[0])).toBe(true);
      const scopeCards = fixture.nativeElement.querySelectorAll('.ml-4 .card');
      expect(scopeCards.length).toBe(2);
    });

    it('should mark a scope as done and update elapsed time', async () => {
      const scopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00')),
        new Scope(new Date('2026-05-10T14:00'), new Date('2026-05-10T15:00')),
      ];
      const tasks = [createMockAlgoTask(1, 'Algo Task 1', scopes)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      // Expand first
      const expandButton = fixture.nativeElement.querySelector('button[title="Expand"]');
      expandButton.click();
      fixture.detectChanges();

      const scopeDoneButton = fixture.nativeElement.querySelector(
        '.ml-4 button[title="Mark as done"]',
      );
      expect(scopes[0].isFinished).toBe(false);
      expect(tasks[0].isFinished).toBe(false);

      scopeDoneButton.click();
      fixture.detectChanges();

      expect(scopes[0].isFinished).toBe(true);
      expect(tasks[0].isFinished).toBe(false); // Not all scopes done yet
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(1, {
        type: 'dynamic',
        elapsed: 'PT60M',
      });
    });

    it('should mark algo task as done when all scopes are done', async () => {
      const scopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00')),
        new Scope(new Date('2026-05-10T14:00'), new Date('2026-05-10T15:00')),
      ];
      const tasks = [createMockAlgoTask(1, 'Algo Task 1', scopes)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      // Expand
      const expandButton = fixture.nativeElement.querySelector('.expand-btn');
      expandButton.click();
      fixture.detectChanges();

      const scopeButtons = fixture.nativeElement.querySelectorAll('.ml-4 button[title="Mark as done"]');
      scopeButtons[0].click();
      scopeButtons[1].click();
      fixture.detectChanges();

      expect(scopes[0].isFinished).toBe(true);
      expect(scopes[1].isFinished).toBe(true);
      expect(tasks[0].isFinished).toBe(true);
      expect(mockTaskService.updateTask).toHaveBeenLastCalledWith(1, {
        type: 'dynamic',
        elapsed: 'PT120M',
      });
    });

    it('should show progress bar for algo tasks', () => {
      const scopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00')),
        new Scope(new Date('2026-05-10T14:00'), new Date('2026-05-10T15:00')),
      ];
      const tasks = [createMockAlgoTask(1, 'Algo Task 1', scopes)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const progress = fixture.nativeElement.querySelector('progress');
      expect(progress).toBeTruthy();
      expect(progress.value).toBe(0);
    });

    it('should update progress bar value when scope is marked done', () => {
      const scopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00')),
        new Scope(new Date('2026-05-10T14:00'), new Date('2026-05-10T15:00')),
      ];
      const tasks = [createMockAlgoTask(1, 'Algo Task 1', scopes)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      // Expand
      const expandButton = fixture.nativeElement.querySelector('.expand-btn');
      expandButton.click();
      fixture.detectChanges();

      const scopeDoneButton = fixture.nativeElement.querySelector(
        '.ml-4 button[title="Mark as done"]',
      );
      scopeDoneButton.click();
      fixture.detectChanges();

      const progress = fixture.nativeElement.querySelector('progress');
      expect(progress.value).toBe(50);
    });

    it('should apply task-done class to algo task when all scopes are finished', () => {
      const scopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00'), true),
        new Scope(new Date('2026-05-10T14:00'), new Date('2026-05-10T15:00'), true),
      ];
      const tasks = [createMockAlgoTask(1, 'Algo Task 1', scopes, true)];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.card');
      expect(card.classList.contains('task-done')).toBe(true);
    });

    it('should filter algo tasks by done status when all scopes are done', () => {
      const doneScopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00'), true),
      ];
      const openScopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00'), false),
      ];
      const tasks = [
        createMockAlgoTask(1, 'Open Algo', openScopes),
        createMockAlgoTask(2, 'Done Algo', doneScopes, true),
      ];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      component.setFilter('done');

      const filteredTasks = component.filteringTasks();
      expect(filteredTasks.length).toBe(1);
      expect(filteredTasks[0].title).toBe('Done Algo');
    });

    it('should filter algo tasks by todo status when not all scopes are done', () => {
      const doneScopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00'), true),
      ];
      const openScopes = [
        new Scope(new Date('2026-05-10T09:00'), new Date('2026-05-10T10:00'), false),
      ];
      const tasks = [
        createMockAlgoTask(1, 'Open Algo', openScopes),
        createMockAlgoTask(2, 'Done Algo', doneScopes, true),
      ];
      mockTaskService.tasks$.next(tasks);
      fixture.detectChanges();

      component.setFilter('todo');

      const filteredTasks = component.filteringTasks();
      expect(filteredTasks.length).toBe(1);
      expect(filteredTasks[0].title).toBe('Open Algo');
    });
  });

  it('should stop event propagation when mark-as-done is clicked', () => {
    const tasks = [createMockTask(1, 'Task 1')];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    const cardClickSpy = vi.fn();
    card.addEventListener('click', cardClickSpy);

    const markDoneButton = fixture.nativeElement.querySelector('button[title="Mark as done"]');
    markDoneButton.click();

    expect(cardClickSpy).not.toHaveBeenCalled();
  });

  it('should show empty state when no tasks match the filter', () => {
    component.setFilter('todo');
    const tasks = [createMockTask(1, 'Done Task', true)];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.text-center');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No tasks found');
  });
});

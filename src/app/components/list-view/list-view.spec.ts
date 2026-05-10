import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListView } from './list-view';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../api/api';
import { Auth } from '@services/auth';
import { BehaviorSubject } from 'rxjs';
import { StaticTask } from '@app/model/static-task';
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

  const mockTaskService = {
    tasks$: new BehaviorSubject<Task[]>([]),
    getTask: vi.fn(),
    deleteTask: vi.fn(),
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

  it('should display mark-as-done buttons for each task', () => {
    const tasks = [createMockTask(1, 'Task 1'), createMockTask(2, 'Task 2')];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button[title="Mark as done"]');
    expect(buttons.length).toBe(2);
  });

  it('should mark a task as done when the button is clicked', () => {
    const tasks = [createMockTask(1, 'Task 1')];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const markDoneButton = fixture.nativeElement.querySelector('button[title="Mark as done"]');
    expect(tasks[0].isFinished).toBe(false);

    markDoneButton.click();
    fixture.detectChanges();

    expect(tasks[0].isFinished).toBe(true);
  });

  it('should mark a done task as open when the button is clicked again', () => {
    const tasks = [createMockTask(1, 'Task 1', true)];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const markOpenButton = fixture.nativeElement.querySelector('button[title="Mark as open"]');
    expect(tasks[0].isFinished).toBe(true);

    markOpenButton.click();
    fixture.detectChanges();

    expect(tasks[0].isFinished).toBe(false);
  });

  it('should apply text-warning class to the button when task is open', () => {
    const tasks = [createMockTask(1, 'Task 1', false)];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[title="Mark as done"]');
    expect(button.classList.contains('text-warning')).toBe(true);
    expect(button.classList.contains('text-success')).toBe(false);
  });

  it('should apply text-success class to the button when task is finished', () => {
    const tasks = [createMockTask(1, 'Task 1', true)];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[title="Mark as open"]');
    expect(button.classList.contains('text-success')).toBe(true);
    expect(button.classList.contains('text-warning')).toBe(false);
  });

  it('should apply task-done class to finished tasks', () => {
    const tasks = [createMockTask(1, 'Done Task', true)];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    expect(card.classList.contains('task-done')).toBe(true);
  });

  it('should not apply task-done class to open tasks', () => {
    const tasks = [createMockTask(1, 'Open Task', false)];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    expect(card.classList.contains('task-done')).toBe(false);
  });

  it('should render mixed done and open tasks with correct styling', () => {
    const tasks = [
      createMockTask(1, 'Open Task', false),
      createMockTask(2, 'Done Task', true),
    ];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.card');
    expect(cards.length).toBe(2);
    expect(cards[0].classList.contains('task-done')).toBe(false);
    expect(cards[1].classList.contains('task-done')).toBe(true);
  });

  it('should toggle task-done class when mark-as-done is clicked', () => {
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

  it('should filter tasks by done status', () => {
    const tasks = [
      createMockTask(1, 'Open Task', false),
      createMockTask(2, 'Done Task', true),
    ];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    component.setFilter('done');

    const filteredTasks = component.filteringTasks();
    expect(filteredTasks.length).toBe(1);
    expect(filteredTasks[0].title).toBe('Done Task');
  });

  it('should filter tasks by todo status', () => {
    const tasks = [
      createMockTask(1, 'Open Task', false),
      createMockTask(2, 'Done Task', true),
    ];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    component.setFilter('todo');

    const filteredTasks = component.filteringTasks();
    expect(filteredTasks.length).toBe(1);
    expect(filteredTasks[0].title).toBe('Open Task');
  });

  it('should update counts when tasks change', () => {
    const tasks = [
      createMockTask(1, 'Open Task 1', false),
      createMockTask(2, 'Open Task 2', false),
      createMockTask(3, 'Done Task', true),
    ];
    mockTaskService.tasks$.next(tasks);
    fixture.detectChanges();

    expect(component.openCount()).toBe(2);
    expect(component.doneCount()).toBe(1);
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

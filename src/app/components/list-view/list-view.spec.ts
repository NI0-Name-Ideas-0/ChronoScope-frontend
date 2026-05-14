import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListView } from './list-view';
import { TaskService } from '@services/task.service';
import { BehaviorSubject } from 'rxjs';
import { StaticTask } from '@app/model/static-task';
import { AlgoTask } from '@app/model/algo-task';
import { Scope } from '@app/model/scope';
import { Task } from '@app/model/task';

describe('ListView', () => {
  let component: ListView;
  let fixture: ComponentFixture<ListView>;

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
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListView);
    component = fixture.componentInstance;
    component.activeFilter = 'all';
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockTaskService.tasks$.next([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render tasks from the task service', () => {
    mockTaskService.tasks$.next([createStaticTask(1, 'Task 1')]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Task 1');
  });

  it('should toggle static task done state', () => {
    const task = createStaticTask(1, 'Task 1');
    mockTaskService.tasks$.next([task]);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[title="Mark as done"]');
    button.click();
    fixture.detectChanges();

    expect(task.isFinished).toBe(true);
    expect(mockTaskService.saveTaskCompletion).toHaveBeenCalledWith(1, true);
  });

  it('should expand algo task and render scopes', () => {
    const task = createAlgoTask(1, 'Algo Task', [
      new Scope(new Date(), new Date(Date.now() + 3600000)),
    ]);
    mockTaskService.tasks$.next([task]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ml-4')).toBeFalsy();

    const expandButton = fixture.nativeElement.querySelector('button[title="Expand"]');
    expandButton.click();
    fixture.detectChanges();

    expect(component.isExpanded(task)).toBe(true);
    expect(fixture.nativeElement.querySelector('.ml-4')).toBeTruthy();
  });

  it('should mark scope done and update elapsed time', async () => {
    const task = createAlgoTask(1, 'Algo Task', [
      new Scope(new Date(), new Date(Date.now() + 3600000)),
    ]);
    mockTaskService.tasks$.next([task]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[title="Expand"]').click();
    fixture.detectChanges();

    const scopeButton = fixture.nativeElement.querySelector('.ml-4 button[title="Mark as done"]');
    scopeButton.click();
    fixture.detectChanges();

    expect((task as AlgoTask).scopes[0].isFinished).toBe(true);
    expect(mockTaskService.saveTaskCompletion).toHaveBeenCalledWith(1, true, [true]);
    expect(mockTaskService.updateTask).toHaveBeenCalledWith(1, {
      type: 'dynamic',
      elapsed: 'PT60M',
    });
  });

  it('should show progress bar for algo tasks', () => {
    const task = createAlgoTask(1, 'Algo Task', [
      new Scope(new Date(), new Date(Date.now() + 3600000)),
    ]);
    mockTaskService.tasks$.next([task]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('progress')).toBeTruthy();
  });

  it('should apply task-done class when static task is finished', () => {
    const task = createStaticTask(1, 'Done Task', true);
    mockTaskService.tasks$.next([task]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    expect(card.classList.contains('task-done')).toBe(true);
  });

  it('should filter by done status', () => {
    const open = createStaticTask(1, 'Open');
    const done = createStaticTask(2, 'Done', true);
    mockTaskService.tasks$.next([open, done]);
    fixture.detectChanges();

    component.setFilter('done');

    expect(component.filteringTasks().length).toBe(1);
    expect(component.filteringTasks()[0].title).toBe('Done');
  });

  it('should show empty state when no tasks match', () => {
    component.setFilter('todo');
    mockTaskService.tasks$.next([createStaticTask(1, 'Done', true)]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tasks found');
  });

  it('should stop event propagation when clicking mark done', () => {
    const task = createStaticTask(1, 'Task 1');
    mockTaskService.tasks$.next([task]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.card');
    const cardClickSpy = vi.fn();
    card.addEventListener('click', cardClickSpy);

    fixture.nativeElement.querySelector('button[title="Mark as done"]').click();

    expect(cardClickSpy).not.toHaveBeenCalled();
  });
});

function createStaticTask(id: number, title: string, isFinished = false): Task {
  return new StaticTask(
    id,
    title,
    'Description',
    [],
    new Scope(new Date(), new Date()),
    null,
    'EASY',
    isFinished,
  );
}

function createAlgoTask(
  id: number,
  title: string,
  scopes: Scope[] = [],
  isFinished = false,
): Task {
  return new AlgoTask(
    id,
    title,
    'Description',
    new Date(),
    new Date(),
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
}

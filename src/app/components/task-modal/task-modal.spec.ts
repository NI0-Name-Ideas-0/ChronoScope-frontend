import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, BehaviorSubject, of } from 'rxjs';

import { TaskModal } from './task-modal';
import { TaskModalService, ModalOpenEvent } from '@services/task-modal.service';
import { Auth } from '@services/auth';
import { TaskService } from '@services/task.service';
import { Task } from '@app/model/task';
import { AlgoTask } from '@app/model/algo-task';
import { Scope } from '@app/model/scope';
import { StaticTaskResponse, DynamicTaskResponse } from '../../../api/models';

describe('TaskModal', () => {
  let component: TaskModal;
  let fixture: ComponentFixture<TaskModal>;
  let openSubject: Subject<ModalOpenEvent>;

  const mockAuth = {
    identity$: of(null),
  };

  const mockTaskService = {
    createTask: vi.fn().mockResolvedValue({}),
    updateTask: vi.fn().mockResolvedValue({}),
    deleteTask: vi.fn().mockResolvedValue({}),
    tasks$: new BehaviorSubject<Task[]>([]),
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    openSubject = new Subject<ModalOpenEvent>();

    const mockTaskModalService = {
      open$: openSubject.asObservable(),
      open: vi.fn(),
      openForEdit: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskModal],
      providers: [
        { provide: TaskModalService, useValue: mockTaskModalService },
        { provide: Auth, useValue: mockAuth },
        { provide: TaskService, useValue: mockTaskService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockTaskService.tasks$.next([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open modal on open$ without task and create empty forms', () => {
    openSubject.next({});

    expect(component.isOpen()).toBe(true);
    expect(component.editingTask).toBeNull();
    expect(component.staticTask.title).toBe('');
    expect(component.dynamicTask.title).toBe('');
    expect(component.mode).toBe('static');
  });

  it('should open modal on open$ with static task and populate forms', () => {
    const task: StaticTaskResponse = {
      type: 'static',
      id: 1,
      name: 'Test Task',
      description: 'Test Description',
      labels: [{ id: 1, name: 'label1', taskId: 1 }],
      organizationId: 'org-1',
      difficulty: 'EASY',
      startAt: '2024-01-01T09:00:00Z',
      endAt: '2024-01-01T10:00:00Z',
      rrule: '',
      isBlocker: false,
    };

    openSubject.next({ task });

    expect(component.isOpen()).toBe(true);
    expect(component.editingTask).toBe(task);
    expect(component.mode).toBe('static');
    expect(component.staticTask.title).toBe('Test Task');
    expect(component.staticTask.description).toBe('Test Description');
    expect(component.staticTask.labels).toEqual(['label1']);
    expect(component.staticTask.organizationId).toBe('org-1');
  });

  it('should open modal on open$ with dynamic task and populate forms', () => {
    const task: DynamicTaskResponse = {
      type: 'dynamic',
      id: 2,
      name: 'Dynamic Task',
      description: 'Dynamic Desc',
      labels: [{ id: 2, name: 'dynLabel', taskId: 2 }],
      organizationId: 'org-2',
      difficulty: 'HARD',
      startAt: '2024-02-01T00:00:00Z',
      endAt: '2024-02-10T00:00:00Z',
      duration: 'PT90M',
      minScopeDuration: 'PT30M',
      maxScopeDuration: 'PT120M',
      dependencies: [1],
    };

    openSubject.next({ task });

    expect(component.isOpen()).toBe(true);
    expect(component.editingTask).toBe(task);
    expect(component.mode).toBe('planned');
    expect(component.dynamicTask.title).toBe('Dynamic Task');
    expect(component.dynamicTask.description).toBe('Dynamic Desc');
    expect(component.dynamicTask.labels).toEqual(['dynLabel']);
    expect(component.dynamicTask.organizationId).toBe('org-2');
    expect(component.dynamicTask.duration).toBe(90);
    expect(component.dynamicTask.minScopeDuration).toBe(30);
    expect(component.dynamicTask.maxScopeDuration).toBe(120);
    expect(component.dynamicTask.dependencies).toEqual([1]);
    expect(component.dynamicTask.startDate).toBe('2024-02-01');
    expect(component.dynamicTask.dueDate).toBe('2024-02-10');
  });

  it('should populate dynamic task with numeric duration strings', () => {
    const task: DynamicTaskResponse = {
      type: 'dynamic',
      id: 3,
      name: 'Numeric Duration Task',
      duration: '45',
      minScopeDuration: '15',
      maxScopeDuration: '60',
      startAt: '2024-03-01T00:00:00Z',
      endAt: '2024-03-05T00:00:00Z',
    };

    openSubject.next({ task });

    expect(component.dynamicTask.duration).toBe(45);
    expect(component.dynamicTask.minScopeDuration).toBe(15);
    expect(component.dynamicTask.maxScopeDuration).toBe(60);
  });

  it('should populate dynamic task with fallback durations when missing', () => {
    const task: DynamicTaskResponse = {
      type: 'dynamic',
      id: 4,
      name: 'No Duration Task',
      startAt: '2024-04-01T00:00:00Z',
      endAt: '2024-04-05T00:00:00Z',
    };

    openSubject.next({ task });

    expect(component.dynamicTask.duration).toBe(60);
    expect(component.dynamicTask.minScopeDuration).toBe(30);
    expect(component.dynamicTask.maxScopeDuration).toBe(120);
  });

  it('should return false from isValid when title is empty', () => {
    component.mode = 'static';
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: '',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    expect(component.isValid).toBe(false);
  });

  it('should return true from isValid for valid static task', () => {
    component.mode = 'static';
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Valid Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    expect(component.isValid).toBe(true);
  });

  it('should return false from isValid when static startDate > endDate', () => {
    component.mode = 'static';
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-02',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid when static same date and startTime > endTime', () => {
    component.mode = 'static';
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '11:00',
      endTime: '10:00',
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid for dynamic task with empty title', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: '',
      startDate: '2024-01-01',
      dueDate: '2024-01-02',
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid for dynamic task when startDate > dueDate', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'Task',
      startDate: '2024-01-02',
      dueDate: '2024-01-01',
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid for dynamic task when duration <= 0', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'Task',
      startDate: '2024-01-01',
      dueDate: '2024-01-02',
      duration: 0,
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid for dynamic task when minScopeDuration <= 0', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'Task',
      startDate: '2024-01-01',
      dueDate: '2024-01-02',
      minScopeDuration: 0,
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid for dynamic task when maxScopeDuration < minScopeDuration', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'Task',
      startDate: '2024-01-01',
      dueDate: '2024-01-02',
      minScopeDuration: 60,
      maxScopeDuration: 30,
    };

    expect(component.isValid).toBe(false);
  });

  it('should return true from isValid for valid dynamic task', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'Valid Task',
      startDate: '2024-01-01',
      dueDate: '2024-01-02',
      duration: 60,
      minScopeDuration: 30,
      maxScopeDuration: 120,
    };

    expect(component.isValid).toBe(true);
  });

  it('should return false from isValid when static dates are missing', () => {
    component.mode = 'static';
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '',
      endDate: '',
    };

    expect(component.isValid).toBe(false);
  });

  it('should return false from isValid when dynamic dates are missing', () => {
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'Task',
      startDate: '',
      dueDate: '',
    };

    expect(component.isValid).toBe(false);
  });

  it('should add and remove labels in static mode', () => {
    component.mode = 'static';
    component.staticTask = component.emptyStaticTask();

    component.addLabel('new-label');
    expect(component.staticTask.labels).toContain('new-label');

    component.removeLabel('new-label');
    expect(component.staticTask.labels).not.toContain('new-label');
  });

  it('should add and remove labels in planned mode', () => {
    component.mode = 'planned';
    component.dynamicTask = component.emptyDynamicTask();

    component.addLabel('planned-label');
    expect(component.dynamicTask.labels).toContain('planned-label');

    component.removeLabel('planned-label');
    expect(component.dynamicTask.labels).not.toContain('planned-label');
  });

  it('should not add duplicate labels', () => {
    component.mode = 'static';
    component.staticTask = { ...component.emptyStaticTask(), labels: ['existing'] };

    component.addLabel('existing');
    expect(component.staticTask.labels).toEqual(['existing']);
  });

  it('should not add empty labels', () => {
    component.mode = 'static';
    component.staticTask = component.emptyStaticTask();

    component.addLabel('  ');
    expect(component.staticTask.labels).toEqual([]);
  });

  it('should clear organizationId when blocker is toggled on', () => {
    component.staticTask = component.emptyStaticTask();
    component.staticTask.organizationId = 'org-1';

    component.onBlockerToggle(true);

    expect(component.staticTask.organizationId).toBeUndefined();
  });

  it('should not clear organizationId when blocker is toggled off', () => {
    component.staticTask = component.emptyStaticTask();
    component.staticTask.organizationId = 'org-1';

    component.onBlockerToggle(false);

    expect(component.staticTask.organizationId).toBe('org-1');
  });

  it('should add and remove dependencies', () => {
    component.dynamicTask = component.emptyDynamicTask();

    component.addDependency('5');
    expect(component.dynamicTask.dependencies).toContain(5);

    component.addDependency('5');
    expect(component.dynamicTask.dependencies).toEqual([5]);

    component.removeDependency(5);
    expect(component.dynamicTask.dependencies).not.toContain(5);
  });

  it('should not add dependency with invalid id', () => {
    component.dynamicTask = component.emptyDynamicTask();

    component.addDependency('not-a-number');
    expect(component.dynamicTask.dependencies).toEqual([]);
  });

  it('should filter available dependency options', () => {
    const tasks: Task[] = [
      new AlgoTask(1, 'Algo 1', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
      new AlgoTask(2, 'Algo 2', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
    ];

    component.dynamicTask = { ...component.emptyDynamicTask(), dependencies: [1] };

    const available = component.availableDependencyOptions(tasks);
    expect(available.length).toBe(1);
    expect(available[0].id).toBe(2);
  });

  it('should exclude current editing task from available dependencies', () => {
    const tasks: Task[] = [
      new AlgoTask(1, 'Algo 1', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
      new AlgoTask(10, 'Current', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
    ];

    component.editingTask = { id: 10, type: 'dynamic' } as DynamicTaskResponse;
    component.dynamicTask = component.emptyDynamicTask();

    const available = component.availableDependencyOptions(tasks);
    expect(available.length).toBe(1);
    expect(available[0].id).toBe(1);
  });

  it('should get dependency label when task is found', () => {
    const tasks: Task[] = [
      new AlgoTask(1, 'Found Task', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
    ];

    expect(component.getDependencyLabel(1, tasks)).toBe('Found Task');
  });

  it('should get fallback dependency label when task is not found', () => {
    const tasks: Task[] = [];

    expect(component.getDependencyLabel(99, tasks)).toBe('Task #99');
  });

  it('should return currentTask based on mode', () => {
    component.mode = 'static';
    expect(component.currentTask).toBe(component.staticTask);

    component.mode = 'planned';
    expect(component.currentTask).toBe(component.dynamicTask);
  });

  it('should return correct difficulty labels', () => {
    expect(component.getDifficultyLabel(0)).toBe('TRIVIAL');
    expect(component.getDifficultyLabel(1)).toBe('EASY');
    expect(component.getDifficultyLabel(2)).toBe('MEDIUM');
    expect(component.getDifficultyLabel(4)).toBe('EXTREME');
    expect(component.getDifficultyLabel(99)).toBeUndefined();
  });

  it('should return correct isOrganizationDisabled state', () => {
    component.mode = 'static';
    component.staticTask = component.emptyStaticTask();
    component.editingTask = null;
    component.staticTask.isBlocker = false;
    expect(component.isOrganizationDisabled).toBe(false);

    component.editingTask = { id: 1, type: 'static' } as StaticTaskResponse;
    expect(component.isOrganizationDisabled).toBe(true);

    component.editingTask = null;
    component.staticTask.isBlocker = true;
    expect(component.isOrganizationDisabled).toBe(true);
  });

  it('should set isLeaving and close after delay', () => {
    vi.useFakeTimers();

    openSubject.next({});
    expect(component.isOpen()).toBe(true);

    component.close();

    expect(component.isLeaving()).toBe(true);
    expect(component.isOpen()).toBe(true);

    vi.advanceTimersByTime(200);

    expect(component.isLeaving()).toBe(false);
    expect(component.isOpen()).toBe(false);
  });

  it('should call taskService.createTask when submitting valid static create', async () => {
    vi.useFakeTimers();
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'New Static Task',
      description: 'Desc',
      startDate: '2024-01-01',
      startTime: '09:00',
      endDate: '2024-01-01',
      endTime: '10:00',
      labels: ['label1'],
      organizationId: 'org-1',
      difficulty: 'EASY',
      rrule: '',
      isBlocker: false,
    };

    await component.submit();
    await vi.advanceTimersByTimeAsync(200);

    expect(mockTaskService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'static',
        name: 'New Static Task',
        description: 'Desc',
        difficulty: 'EASY',
        organizationId: 'org-1',
        rrule: '',
        isBlocker: false,
      }),
    );
    expect(component.isOpen()).toBe(false);
  });

  it('should call taskService.updateTask when submitting valid static update', async () => {
    const task: StaticTaskResponse = {
      type: 'static',
      id: 1,
      name: 'Old Name',
      description: 'Old Desc',
      startAt: '2024-01-01T09:00:00Z',
      endAt: '2024-01-01T10:00:00Z',
      difficulty: 'EASY',
    };

    openSubject.next({ task });
    component.staticTask.title = 'Updated Name';
    component.staticTask.description = 'Updated Desc';
    component.staticTask.startDate = '2024-01-02';
    component.staticTask.startTime = '10:00';
    component.staticTask.endDate = '2024-01-02';
    component.staticTask.endTime = '11:00';

    await component.submit();

    expect(mockTaskService.updateTask).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        type: 'static',
        name: 'Updated Name',
        description: 'Updated Desc',
      }),
    );
  });

  it('should call taskService.createTask when submitting valid dynamic create', async () => {
    vi.useFakeTimers();
    openSubject.next({});
    component.mode = 'planned';
    component.dynamicTask = {
      ...component.emptyDynamicTask(),
      title: 'New Dynamic Task',
      description: 'Dynamic Desc',
      startDate: '2024-01-01',
      dueDate: '2024-01-05',
      duration: 90,
      minScopeDuration: 30,
      maxScopeDuration: 120,
      dependencies: [1, 2],
      labels: ['dyn-label'],
      organizationId: 'org-1',
      difficulty: 'HARD',
    };

    await component.submit();
    await vi.advanceTimersByTimeAsync(200);

    expect(mockTaskService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dynamic',
        name: 'New Dynamic Task',
        description: 'Dynamic Desc',
        difficulty: 'HARD',
        organizationId: 'org-1',
        duration: 'PT90M',
        minScopeDuration: 'PT30M',
        maxScopeDuration: 'PT120M',
        dependencies: [1, 2],
      }),
    );
    expect(component.isOpen()).toBe(false);
  });

  it('should call taskService.updateTask when submitting valid dynamic update', async () => {
    const task: DynamicTaskResponse = {
      type: 'dynamic',
      id: 5,
      name: 'Old Dynamic',
      startAt: '2024-01-01T00:00:00Z',
      endAt: '2024-01-10T00:00:00Z',
      duration: 'PT60M',
      difficulty: 'MEDIUM',
    };

    openSubject.next({ task });
    component.dynamicTask.title = 'Updated Dynamic';
    component.dynamicTask.duration = 45;

    await component.submit();

    expect(mockTaskService.updateTask).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        type: 'dynamic',
        name: 'Updated Dynamic',
        duration: 'PT45M',
      }),
    );
  });

  it('should not submit when isValid is false', async () => {
    openSubject.next({});
    component.staticTask = { ...component.emptyStaticTask(), title: '' };

    await component.submit();

    expect(mockTaskService.createTask).not.toHaveBeenCalled();
  });

  it('should set network error message on submit failure', async () => {
    mockTaskService.createTask.mockRejectedValueOnce(new Error('network error'));
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    await component.submit();

    expect(component.errorMessage()).toContain('Network error');
    expect(component.isSaving()).toBe(false);
  });

  it('should set 401 error message on submit failure', async () => {
    mockTaskService.createTask.mockRejectedValueOnce(new Error('401 Unauthorized'));
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    await component.submit();

    expect(component.errorMessage()).toContain('session has expired');
  });

  it('should set 403 error message on submit failure', async () => {
    mockTaskService.createTask.mockRejectedValueOnce(new Error('403 Forbidden'));
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    await component.submit();

    expect(component.errorMessage()).toContain('permission');
  });

  it('should set 400 error message on submit failure', async () => {
    mockTaskService.createTask.mockRejectedValueOnce(new Error('400 Bad Request'));
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    await component.submit();

    expect(component.errorMessage()).toContain('Invalid task data');
  });

  it('should set generic error message on unknown submit failure', async () => {
    mockTaskService.createTask.mockRejectedValueOnce(new Error('some random error'));
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    await component.submit();

    expect(component.errorMessage()).toBe('Failed to save task. Please check your input and try again.');
  });

  it('should set generic error message when error is not an Error instance', async () => {
    mockTaskService.createTask.mockRejectedValueOnce('string error');
    openSubject.next({});
    component.staticTask = {
      ...component.emptyStaticTask(),
      title: 'Task',
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
    };

    await component.submit();

    expect(component.errorMessage()).toBe('Failed to save task. Please check your input and try again.');
  });

  it('should not delete task when not editing', async () => {
    component.editingTask = null;

    await component.deleteTask();

    expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
  });

  it('should not delete task when user cancels confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.editingTask = {
      type: 'static',
      id: 1,
      name: 'Task to Keep',
    } as StaticTaskResponse;

    await component.deleteTask();

    expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should call taskService.deleteTask when deleteTask is confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.editingTask = {
      type: 'static',
      id: 1,
      name: 'Task to Delete',
    } as StaticTaskResponse;

    await component.deleteTask();

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith(1);
    confirmSpy.mockRestore();
  });

  it('should set error message when deleteTask fails', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockTaskService.deleteTask.mockRejectedValueOnce(new Error('delete failed'));

    component.editingTask = {
      type: 'static',
      id: 1,
      name: 'Task to Delete',
    } as StaticTaskResponse;

    await component.deleteTask();

    expect(component.errorMessage()).toBe('Failed to delete task. Please try again.');
    expect(component.isSaving()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should update rrule on onRruleChange', () => {
    component.staticTask = component.emptyStaticTask();
    component.onRruleChange('FREQ=DAILY');
    expect(component.staticTask.rrule).toBe('FREQ=DAILY');
  });

  it('should return correct task start and end dates', () => {
    component.staticTask = {
      ...component.emptyStaticTask(),
      startDate: '2024-06-15',
      startTime: '14:30',
      endDate: '2024-06-16',
      endTime: '16:45',
    };

    expect(component.getTaskStartDate().toISOString()).toBe(new Date('2024-06-15T14:30').toISOString());
    expect(component.getTaskEndDate().toISOString()).toBe(new Date('2024-06-16T16:45').toISOString());
  });

  it('should close modal on backdrop click', () => {
    vi.useFakeTimers();
    openSubject.next({});
    expect(component.isOpen()).toBe(true);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: event.currentTarget });
    component.onBackdropClick(event);

    expect(component.isLeaving()).toBe(true);
    vi.advanceTimersByTime(200);
    expect(component.isOpen()).toBe(false);
  });

  it('should not close modal when clicking inside panel', () => {
    openSubject.next({});
    expect(component.isOpen()).toBe(true);

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    component.onBackdropClick(event);

    expect(component.isOpen()).toBe(true);
  });

  // Template branch coverage tests
  describe('template branches', () => {
    it('should render error message when set', () => {
      openSubject.next({});
      component.errorMessage.set('Something went wrong');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.alert-error')).toBeTruthy();
    });

    it('should render planned mode fields when mode is planned', () => {
      openSubject.next({});
      component.mode = 'planned';
      component.dynamicTask = {
        ...component.emptyDynamicTask(),
        title: 'Planned',
        startDate: '2024-01-01',
        dueDate: '2024-01-02',
      };
      fixture.detectChanges();

      const inputs = fixture.nativeElement.querySelectorAll('input');
      const hasDueDate = Array.from(inputs).some(
        (input: any) => input.getAttribute('ng-reflect-model') === '2024-01-02' || input.value === '2024-01-02',
      );
      // Due date input exists in planned mode
      expect(fixture.nativeElement.textContent).toContain('Due Date');
    });

    it('should render static mode fields when mode is static', () => {
      openSubject.next({});
      component.mode = 'static';
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('End Date');
      expect(fixture.nativeElement.textContent).toContain('Blocker');
    });

    it('should render isEditing header and delete button', () => {
      const task: StaticTaskResponse = {
        type: 'static',
        id: 1,
        name: 'Edit Me',
        startAt: '2024-01-01T09:00:00Z',
        endAt: '2024-01-01T10:00:00Z',
      };
      openSubject.next({ task });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Edit Task');
      expect(fixture.nativeElement.querySelector('.btn-error')).toBeTruthy();
    });

    it('should render saving spinner', () => {
      openSubject.next({});
      component.isSaving.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Saving...');
    });

    it('should render label badges when labels exist', () => {
      openSubject.next({});
      component.staticTask = { ...component.emptyStaticTask(), labels: ['urgent', 'work'] };
      fixture.detectChanges();

      const badges = fixture.nativeElement.querySelectorAll('.badge-neutral');
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it('should render dependency badges when dependencies exist', () => {
      openSubject.next({});
      component.mode = 'planned';
      component.dynamicTask = {
        ...component.emptyDynamicTask(),
        dependencies: [1],
      };
      mockTaskService.tasks$.next([
        new AlgoTask(1, 'Dep Task', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
      ]);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Dep Task');
    });

    it('should render dependency select with available options', () => {
      openSubject.next({});
      component.mode = 'planned';
      mockTaskService.tasks$.next([
        new AlgoTask(1, 'Option 1', '', new Date(), new Date(), 60, [], [], null, [], 'EASY', false, 30, 120),
      ]);
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('select');
      expect(select).toBeTruthy();
    });
  });
});

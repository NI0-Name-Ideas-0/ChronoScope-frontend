import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, BehaviorSubject, of } from 'rxjs';

import { TaskModal } from './task-modal';
import { TaskModalService, ModalOpenEvent } from '@services/task-modal.service';
import { Auth } from '@services/auth';
import { TaskService } from '@services/task.service';
import { Task } from '@app/model/task';
import { StaticTaskResponse } from '../../../api/models';

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

  it('should open modal on open$ with task and populate forms', () => {
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

  it('should add and remove labels', () => {
    component.mode = 'static';
    component.staticTask = component.emptyStaticTask();

    component.addLabel('new-label');
    expect(component.staticTask.labels).toContain('new-label');

    component.removeLabel('new-label');
    expect(component.staticTask.labels).not.toContain('new-label');
  });

  it('should clear organizationId when blocker is toggled on', () => {
    component.staticTask = component.emptyStaticTask();
    component.staticTask.organizationId = 'org-1';

    component.onBlockerToggle(true);

    expect(component.staticTask.organizationId).toBeUndefined();
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
});

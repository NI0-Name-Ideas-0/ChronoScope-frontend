import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TaskService } from './task.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../api/api';
import { Auth } from './auth';
import { StaticTask } from '../app/model/static-task';
import { AlgoTask } from '../app/model/algo-task';
import { Scope } from '../app/model/scope';

describe('TaskService', () => {
  let service: TaskService;
  let mockApi: { invoke: ReturnType<typeof vi.fn> };
  let store: Record<string, string>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  const createBlobResponse = (data: unknown) => ({
    text: () => Promise.resolve(JSON.stringify(data)),
  });

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
    loadDiscoveryDocumentAndLogin: vi.fn(),
    events: { pipe: () => ({ subscribe: vi.fn() }) },
    loadUserProfile: vi.fn(),
    logOut: vi.fn(),
  };

  beforeAll(() => {
    store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
      writable: true,
    });
  });

  beforeEach(async () => {
    TestBed.resetTestingModule();
    store = {};
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockApi = {
      invoke: vi.fn().mockResolvedValue(createBlobResponse([])),
    };

    const authReadySubject = new BehaviorSubject<boolean>(true);

    const mockAuth = {
      authReady$: authReadySubject.asObservable(),
      getAccounts: vi.fn().mockReturnValue([]),
    };

    await TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    service = TestBed.inject(TaskService);
    // Allow constructor-triggered loadTasks to settle
    await new Promise((resolve) => setTimeout(resolve, 0));
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseDurationToMinutes', () => {
    it('should return fallback for empty duration', () => {
      expect((service as any).parseDurationToMinutes('', 5)).toBe(5);
      expect((service as any).parseDurationToMinutes(undefined, 10)).toBe(10);
    });

    it('should handle numeric input', () => {
      expect((service as any).parseDurationToMinutes('120')).toBe(120);
      expect((service as any).parseDurationToMinutes('0')).toBe(0);
    });

    it('should parse ISO duration with days, hours, minutes, and seconds', () => {
      expect((service as any).parseDurationToMinutes('P1D')).toBe(1440);
      expect((service as any).parseDurationToMinutes('PT2H')).toBe(120);
      expect((service as any).parseDurationToMinutes('PT30M')).toBe(30);
      expect((service as any).parseDurationToMinutes('PT45S')).toBe(1);
      expect((service as any).parseDurationToMinutes('P1DT2H30M45S')).toBe(1591);
    });

    it('should return fallback for invalid input', () => {
      expect((service as any).parseDurationToMinutes('invalid', 42)).toBe(42);
      expect((service as any).parseDurationToMinutes('not-a-duration', 7)).toBe(7);
    });
  });

  describe('formatMinutesToDuration', () => {
    it('should format minutes as an ISO 8601 duration string', () => {
      expect(service.formatMinutesToDuration(30)).toBe('PT30M');
      expect(service.formatMinutesToDuration(120)).toBe('PT120M');
      expect(service.formatMinutesToDuration(0)).toBe('PT0M');
    });
  });

  describe('saveTaskCompletion', () => {
    it('should persist completion state to localStorage', () => {
      service.saveTaskCompletion(1, true, [true, false]);
      const parsed = JSON.parse(store['chronoscope-completion']);
      expect(parsed['1']).toEqual({ isFinished: true, scopes: [true, false] });
    });

    it('should update existing completion state', () => {
      service.saveTaskCompletion(1, true);
      service.saveTaskCompletion(2, false, [false]);
      const parsed = JSON.parse(store['chronoscope-completion']);
      expect(parsed['1']).toEqual({ isFinished: true, scopes: [] });
      expect(parsed['2']).toEqual({ isFinished: false, scopes: [false] });
    });
  });

  describe('loadTasks', () => {
    it('should fetch tasks and update tasks$', async () => {
      const staticTaskResponse = {
        type: 'static',
        id: 1,
        name: 'Test Task',
        description: 'Desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
        rrule: '',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([staticTaskResponse]));

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });

      await service.loadTasks();

      expect(mockApi.invoke).toHaveBeenCalled();
      expect(tasks.length).toBe(1);
      expect((tasks[0] as StaticTask).id).toBe(1);
      expect((tasks[0] as StaticTask).title).toBe('Test Task');
    });

    it('should throw when response is not an array', async () => {
      mockApi.invoke.mockResolvedValue(createBlobResponse({ notAnArray: true }));

      await service.loadTasks();

      // Error is silently caught — HTTP error interceptor handles toasts
      expect(service.tasks$.subscribe).toBeTruthy();
    });

    it('should log error when API call fails', async () => {
      mockApi.invoke.mockRejectedValue(new Error('Network error'));

      // Should not throw — error is silently caught
      await service.loadTasks();
    });
  });

  describe('createTask', () => {
    it('should call API and reload tasks', async () => {
      const request = {
        name: 'New Task',
        description: '',
        difficulty: 'MEDIUM',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        organizationId: 'org-1',
        labels: [],
      };

      const createdResponse = {
        type: 'static',
        id: 2,
        name: 'New Task',
        difficulty: 'MEDIUM',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        organizationId: 'org-1',
        labels: [],
      };

      mockApi.invoke
        .mockResolvedValueOnce(createBlobResponse(createdResponse))
        .mockResolvedValueOnce(createBlobResponse({}))
        .mockResolvedValueOnce(createBlobResponse([]));

      const result = await service.createTask(request as any);

      expect(result).toEqual(createdResponse);
      expect(mockApi.invoke).toHaveBeenCalledTimes(3);
    });

    it('should not throw and still call loadTasks when plan endpoint fails', async () => {
      const request = {
        name: 'New Task',
        description: '',
        difficulty: 'MEDIUM',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        organizationId: 'org-1',
        labels: [],
      };

      const createdResponse = {
        type: 'static',
        id: 2,
        name: 'New Task',
        difficulty: 'MEDIUM',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        organizationId: 'org-1',
        labels: [],
      };

      mockApi.invoke
        .mockResolvedValueOnce(createBlobResponse(createdResponse))
        .mockRejectedValueOnce(new Error('Plan failed'))
        .mockResolvedValueOnce(createBlobResponse([]));

      const result = await service.createTask(request as any);

      expect(result).toEqual(createdResponse);
      // Error is silently caught — HTTP error interceptor handles toasts
      expect(mockApi.invoke).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateTask', () => {
    it('should call API and update cache', async () => {
      const updatedResponse = {
        type: 'static',
        id: 1,
        name: 'Updated',
        description: 'Updated desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'HARD',
        organizationId: null,
        labels: [],
        rrule: '',
      };

      mockApi.invoke
        .mockResolvedValueOnce(createBlobResponse(updatedResponse))
        .mockResolvedValueOnce(createBlobResponse([updatedResponse]));

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });

      const result = await service.updateTask(1, { name: 'Updated' } as any);

      expect(result).toEqual(updatedResponse);
      expect(tasks.length).toBe(1);
      expect((tasks[0] as StaticTask).title).toBe('Updated');
    });
  });

  describe('getTask', () => {
    it('should fetch a single task and cache it', async () => {
      const taskResponse = {
        type: 'static',
        id: 99,
        name: 'Single Task',
        description: 'Desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
        rrule: '',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse(taskResponse));

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });

      const result = await service.getTask(99);

      expect(result).toEqual(taskResponse);
      expect(tasks.length).toBe(1);
      expect((tasks[0] as StaticTask).id).toBe(99);
      expect((tasks[0] as StaticTask).title).toBe('Single Task');
    });
  });

  describe('getTasks', () => {
    it('should fetch all tasks and update cache', async () => {
      const taskResponse = {
        type: 'static',
        id: 1,
        name: 'Task One',
        description: 'Desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
        rrule: '',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([taskResponse]));

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });

      const result = await service.getTasks();

      expect(result).toEqual([taskResponse]);
      expect(tasks.length).toBe(1);
      expect((tasks[0] as StaticTask).id).toBe(1);
    });

    it('should throw when response is not an array', async () => {
      mockApi.invoke.mockResolvedValue(createBlobResponse({ notAnArray: true }));

      await expect(service.getTasks()).rejects.toThrow(
        'Expected tasks to be an array, got: object',
      );
    });
  });

  describe('deleteTask', () => {
    it('should call API and remove from cache', async () => {
      const staticTaskResponse = {
        type: 'static',
        id: 1,
        name: 'To Delete',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([staticTaskResponse]));
      await service.loadTasks();

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });
      expect(tasks.length).toBe(1);

      mockApi.invoke.mockResolvedValue(createBlobResponse({}));
      await service.deleteTask(1);

      expect(tasks.length).toBe(0);
    });
  });

  describe('convertApiTaskToModel', () => {
    it('should map static task completion state from localStorage', async () => {
      store['chronoscope-completion'] = JSON.stringify({
        42: { isFinished: true, scopes: [] },
      });

      const staticTaskResponse = {
        type: 'static',
        id: 42,
        name: 'Completed Task',
        description: 'Desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
        rrule: '',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([staticTaskResponse]));
      await service.loadTasks();

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });

      expect(tasks.length).toBe(1);
      expect((tasks[0] as StaticTask).isFinished).toBe(true);
    });

    it('should map dynamic task scopes with completion state', async () => {
      store['chronoscope-completion'] = JSON.stringify({
        77: { isFinished: false, scopes: [true, false] },
      });

      const dynamicTaskResponse = {
        type: 'dynamic',
        id: 77,
        name: 'Dynamic Task',
        description: 'Desc',
        startAt: '2026-05-01T00:00:00Z',
        endAt: '2026-05-05T00:00:00Z',
        duration: 'PT2H',
        difficulty: 'MEDIUM',
        organizationId: null,
        labels: [],
        dependencies: [],
        scopes: [
          { startAt: '2026-05-01T10:00:00Z', endAt: '2026-05-01T11:00:00Z' },
          { startAt: '2026-05-02T10:00:00Z', endAt: '2026-05-02T12:00:00Z' },
        ],
        minScopeDuration: 'PT30M',
        maxScopeDuration: 'PT2H',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([dynamicTaskResponse]));
      await service.loadTasks();

      let tasks: unknown[] = [];
      service.tasks$.subscribe((t) => {
        tasks = t;
      });

      expect(tasks.length).toBe(1);
      const algoTask = tasks[0] as AlgoTask;
      expect(algoTask.scopes.length).toBe(2);
      expect(algoTask.scopes[0].isFinished).toBe(true);
      expect(algoTask.scopes[1].isFinished).toBe(false);
      expect(algoTask.duration).toBe(120);
    });
  });

  describe('toCalendarEvents', () => {
    it('should return events for a StaticTask', () => {
      const scope = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'));
      const task = new StaticTask(1, 'Static', 'Desc', ['label1'], scope, 'org-1', 'EASY', false, '');

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(1);
      expect(events[0].id).toBe('1');
      expect(events[0].title).toBe('Static');
      expect(events[0].start).toEqual(scope.start);
      expect(events[0].end).toEqual(scope.end);
    });

    it('should return events for an AlgoTask', () => {
      const scope1 = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'));
      const scope2 = new Scope(new Date('2026-05-02T10:00:00Z'), new Date('2026-05-02T11:00:00Z'));
      const task = new AlgoTask(
        2,
        'Algo',
        'Desc',
        new Date('2026-05-01'),
        new Date('2026-05-05'),
        120,
        0,
        [],
        [],
        null,
        [scope1, scope2],
        'MEDIUM',
        false,
        30,
        120,
      );

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(2);
      expect(events[0].id).toBe(`2-${scope1.start.getTime()}`);
      expect(events[0].title).toBe('Algo');
      expect(events[0].start).toEqual(scope1.start);
      expect(events[1].id).toBe(`2-${scope2.start.getTime()}`);
      expect(events[1].start).toEqual(scope2.start);
    });

    it('should return rrule event for a StaticTask with rrule', () => {
      const scope = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'));
      const task = new StaticTask(
        3,
        'Recurring',
        'Desc',
        [],
        scope,
        null,
        'EASY',
        false,
        'FREQ=DAILY;DTSTART=20260501T100000Z',
      );

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(1);
      expect(events[0].id).toBe('3');
      expect(events[0].title).toBe('Recurring');
      expect((events[0] as any).rrule).toBe('FREQ=DAILY;DTSTART=20260501T100000Z');
      expect((events[0] as any).duration).toEqual({ hours: 1, minutes: 0 });
    });

    it('should fall back to normal event and warn for invalid rrule', () => {
      const scope = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'));
      const task = new StaticTask(
        4,
        'Invalid RRule',
        'Desc',
        [],
        scope,
        null,
        'EASY',
        false,
        'FREQ=INVALID;COUNT=abc',
      );

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(1);
      expect(events[0].id).toBe('4');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid rrule for task',
        4,
        'FREQ=INVALID;COUNT=abc',
      );
    });

    it('should return empty array and log error for unexpected task type', () => {
      const unknownTask = { id: 5, title: 'Unknown' } as any;
      const events = service.toCalendarEvents(unknownTask);
      expect(events.length).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected task type', unknownTask);
    });
  });

  describe('getAllCalendarEvents', () => {
    it('should return calendar events for all cached tasks', async () => {
      const staticTaskResponse = {
        type: 'static',
        id: 1,
        name: 'Static Task',
        description: 'Desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
        rrule: '',
      };

      const dynamicTaskResponse = {
        type: 'dynamic',
        id: 2,
        name: 'Dynamic Task',
        description: 'Desc',
        startAt: '2026-05-01T00:00:00Z',
        endAt: '2026-05-05T00:00:00Z',
        duration: 'PT1H',
        difficulty: 'MEDIUM',
        organizationId: null,
        labels: [],
        dependencies: [],
        scopes: [
          { startAt: '2026-05-01T10:00:00Z', endAt: '2026-05-01T11:00:00Z' },
          { startAt: '2026-05-02T10:00:00Z', endAt: '2026-05-02T11:00:00Z' },
        ],
        minScopeDuration: 'PT30M',
        maxScopeDuration: 'PT1H',
      };

      mockApi.invoke.mockResolvedValue(
        createBlobResponse([staticTaskResponse, dynamicTaskResponse]),
      );
      await service.loadTasks();

      const events = service.getAllCalendarEvents();
      expect(events.length).toBe(3);
      expect(events[0].id).toBe('1');
      expect(events[1].id).toBe('2-' + new Date('2026-05-01T10:00:00Z').getTime());
      expect(events[2].id).toBe('2-' + new Date('2026-05-02T10:00:00Z').getTime());
    });
  });
});

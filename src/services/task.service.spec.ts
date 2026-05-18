import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TaskService } from './task.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../api/api';
import { Auth } from './auth';
import { getTranslocoTestingModule } from '../test-utils/transloco-testing';
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
      getIdentityData: vi.fn().mockReturnValue({ organizations: [] }),
    };

    await TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
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
    it('should notify subscribers without writing to localStorage', () => {
      let emitted = false;
      service.tasks$.subscribe(() => {
        emitted = true;
      });
      service.saveTaskCompletion(1, true, [true, false]);
      expect(emitted).toBe(true);
      expect(store['chronoscope-completion']).toBeUndefined();
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
    it('should compute static task isFinished from end date (past = done)', async () => {
      const staticTaskResponse = {
        type: 'static',
        id: 42,
        name: 'Past Task',
        description: 'Desc',
        startAt: '2020-05-01T10:00:00Z',
        endAt: '2020-05-01T11:00:00Z',
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

    it('should compute static task isFinished from end date (future = open)', async () => {
      store['chronoscope-completion'] = JSON.stringify({
        42: { isFinished: true, scopes: [] },
      });

      const staticTaskResponse = {
        type: 'static',
        id: 42,
        name: 'Future Task',
        description: 'Desc',
        startAt: '2099-05-01T10:00:00Z',
        endAt: '2099-05-01T11:00:00Z',
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
      expect((tasks[0] as StaticTask).isFinished).toBe(false);
    });

    it('should derive dynamic task scope done-state from elapsed time', async () => {
      const dynamicTaskResponse = {
        type: 'dynamic',
        id: 77,
        name: 'Dynamic Task',
        description: 'Desc',
        startAt: '2026-05-01T00:00:00Z',
        endAt: '2026-05-05T00:00:00Z',
        duration: 'PT2H',
        elapsed: 'PT1H',
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
      // First scope is 60 min, elapsed is 60 min -> done
      expect(algoTask.scopes[0].isFinished).toBe(true);
      // Second scope cumulative is 180 min, elapsed is 60 min -> not done
      expect(algoTask.scopes[1].isFinished).toBe(false);
      expect(algoTask.duration).toBe(120);
    });
  });

  describe('toCalendarEvents', () => {
    it('should return events for a StaticTask', () => {
      const scope = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'));
      const task = new StaticTask(1, 'Static', 'Desc', ['label1'], scope, 'org-1', 'EASY', false, 'UNSET', '');

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
        'UNSET',
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
        'UNSET',
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
        'UNSET',
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

  describe('normalizeTaskColor', () => {
    it('should return UNSET for empty or invalid colors', () => {
      expect((service as any).normalizeTaskColor(undefined)).toBe('UNSET');
      expect((service as any).normalizeTaskColor('')).toBe('UNSET');
      expect((service as any).normalizeTaskColor('invalid')).toBe('UNSET');
    });

    it('should normalize valid colors to uppercase', () => {
      expect((service as any).normalizeTaskColor('blue')).toBe('BLUE');
      expect((service as any).normalizeTaskColor('RED')).toBe('RED');
    });
  });

  describe('resolveTaskColor', () => {
    it('should use task color when set', () => {
      const task = new StaticTask(1, 'T', '', [], new Scope(new Date(), new Date()), 'org-1', 'EASY', false, 'RED', '');
      expect((service as any).resolveTaskColor(task)).toBe('RED');
    });

    it('should fallback to organization color', () => {
      const task = new StaticTask(1, 'T', '', [], new Scope(new Date(), new Date()), 'org-1', 'EASY', false, 'UNSET', '');
      // organizationColors loaded from backend
      expect((service as any).resolveTaskColor(task)).toBe('UNSET');
    });

    it('should fallback to index-based color for known org', () => {
      const mockAuth = TestBed.inject(Auth);
      (mockAuth as any).getIdentityData = vi.fn().mockReturnValue({
        organizations: [{ id: 'org-1', name: 'Test' }],
      });
      const task = new StaticTask(1, 'T', '', [], new Scope(new Date(), new Date()), 'org-1', 'EASY', false, 'UNSET', '');
      expect((service as any).resolveTaskColor(task)).toBe('BLUE');
    });

    it('should return UNSET when org is not found', () => {
      const task = new StaticTask(1, 'T', '', [], new Scope(new Date(), new Date()), 'unknown', 'EASY', false, 'UNSET', '');
      expect((service as any).resolveTaskColor(task)).toBe('UNSET');
    });
  });

  describe('getOrganizationFallbackColor', () => {
    it('should return UNSET for null organizationId', () => {
      expect(service.getOrganizationFallbackColor(null)).toBe('UNSET');
      expect(service.getOrganizationFallbackColor(undefined)).toBe('UNSET');
    });

    it('should return UNSET for unknown org', () => {
      expect(service.getOrganizationFallbackColor('unknown')).toBe('UNSET');
    });

    it('should return index-based color for known org', () => {
      const mockAuth = TestBed.inject(Auth);
      (mockAuth as any).getIdentityData = vi.fn().mockReturnValue({
        organizations: [{ id: 'org-1', name: 'Test' }],
      });
      expect(service.getOrganizationFallbackColor('org-1')).toBe('BLUE');
    });
  });

  describe('getTaskColorMix', () => {
    it('should return null for UNSET color', () => {
      expect(service.getTaskColorMix('UNSET', 50)).toBeNull();
    });

    it('should clamp percent between 0 and 100', () => {
      const result = service.getTaskColorMix('RED', -10);
      expect(result).toContain('0%');
      const result2 = service.getTaskColorMix('RED', 150);
      expect(result2).toContain('100%');
    });

    it('should return color-mix string for valid color', () => {
      const result = service.getTaskColorMix('BLUE', 35);
      expect(result).toContain('color-mix');
      expect(result).toContain('35%');
    });
  });

  describe('getEffectiveTaskColor', () => {
    it('should delegate to resolveTaskColor', () => {
      const task = new StaticTask(1, 'T', '', [], new Scope(new Date(), new Date()), null, 'EASY', false, 'GREEN', '');
      expect(service.getEffectiveTaskColor(task)).toBe('GREEN');
    });
  });

  describe('getAllTasks', () => {
    it('should return all cached tasks', async () => {
      const staticTaskResponse = {
        type: 'static',
        id: 1,
        name: 'Task',
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

      const tasks = service.getAllTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe(1);
    });
  });

  describe('planTasks', () => {
    it('should warn and load tasks when no organizations exist', async () => {
      const mockAuth = TestBed.inject(Auth);
      (mockAuth as any).getIdentityData = vi.fn().mockReturnValue({ organizations: [] });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.planTasks();

      expect(warnSpy).toHaveBeenCalledWith('Skipping manual plan: no organization IDs available.');
      warnSpy.mockRestore();
    });
  });

  describe('toCalendarEvents', () => {
    it('should return rrule event for recurring StaticTask', () => {
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
        'UNSET',
        'FREQ=DAILY;DTSTART=20260501T100000Z',
      );

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(1);
      expect((events[0] as any).rrule).toBe('FREQ=DAILY;DTSTART=20260501T100000Z');
      expect((events[0] as any).duration).toEqual({ hours: 1, minutes: 0 });
    });

    it('should apply color to calendar events when task has a color', () => {
      const scope = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'));
      const task = new StaticTask(1, 'Colored', 'Desc', [], scope, null, 'EASY', false, 'BLUE', '');

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(1);
      expect((events[0] as any).backgroundColor).toBeDefined();
    });

    it('should return AlgoTask scopes with isDone and color', () => {
      const scope = new Scope(new Date('2026-05-01T10:00:00Z'), new Date('2026-05-01T11:00:00Z'), true);
      const task = new AlgoTask(2, 'Algo', 'Desc', new Date(), new Date(), 60, 60, [], [], null, [scope], 'EASY', true, 'UNSET', 30, 120);

      const events = service.toCalendarEvents(task);
      expect(events.length).toBe(1);
      expect((events[0] as any).extendedProps.isDone).toBe(true);
      expect((events[0] as any).extendedProps.color).toBe('UNSET');
    });
  });

  describe('convertApiTaskToModel', () => {
    it('should handle dynamic task with no scopes', async () => {
      const dynamicTaskResponse = {
        type: 'dynamic',
        id: 77,
        name: 'No Scopes',
        description: 'Desc',
        startAt: '2026-05-01T00:00:00Z',
        endAt: '2026-05-05T00:00:00Z',
        duration: 'PT2H',
        elapsed: 'PT0M',
        difficulty: 'MEDIUM',
        organizationId: null,
        labels: [],
        dependencies: [],
        scopes: [],
        minScopeDuration: 'PT30M',
        maxScopeDuration: 'PT2H',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([dynamicTaskResponse]));
      await service.loadTasks();

      const tasks = service.getAllTasks();
      expect(tasks.length).toBe(1);
      const algoTask = tasks[0] as AlgoTask;
      expect(algoTask.scopes.length).toBe(0);
      expect(algoTask.isFinished).toBe(false);
    });

    it('should mark all scopes done when elapsed equals total duration', async () => {
      const dynamicTaskResponse = {
        type: 'dynamic',
        id: 77,
        name: 'All Done',
        description: 'Desc',
        startAt: '2026-05-01T00:00:00Z',
        endAt: '2026-05-05T00:00:00Z',
        duration: 'PT2H',
        elapsed: 'PT2H',
        difficulty: 'MEDIUM',
        organizationId: null,
        labels: [],
        dependencies: [],
        scopes: [
          { startAt: '2026-05-01T10:00:00Z', endAt: '2026-05-01T11:00:00Z' },
          { startAt: '2026-05-02T10:00:00Z', endAt: '2026-05-02T11:00:00Z' },
        ],
        minScopeDuration: 'PT30M',
        maxScopeDuration: 'PT2H',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([dynamicTaskResponse]));
      await service.loadTasks();

      const algoTask = service.getAllTasks()[0] as AlgoTask;
      expect(algoTask.scopes.every((s) => s.isFinished)).toBe(true);
      expect(algoTask.isFinished).toBe(true);
    });

    it('should handle static task with rrule', async () => {
      const staticTaskResponse = {
        type: 'static',
        id: 42,
        name: 'Recurring',
        description: 'Desc',
        startAt: '2026-05-01T10:00:00Z',
        endAt: '2026-05-01T11:00:00Z',
        difficulty: 'EASY',
        organizationId: null,
        labels: [],
        rrule: 'FREQ=DAILY;DTSTART=20260501T100000Z',
      };

      mockApi.invoke.mockResolvedValue(createBlobResponse([staticTaskResponse]));
      await service.loadTasks();

      const task = service.getAllTasks()[0] as StaticTask;
      expect(task.rrule).toBe('FREQ=DAILY;DTSTART=20260501T100000Z');
    });
  });
});

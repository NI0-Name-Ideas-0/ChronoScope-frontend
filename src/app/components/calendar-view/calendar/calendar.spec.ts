import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Calendar } from './calendar';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '@api/api';
import { Auth } from '@services/auth';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { LanguageService } from '@services/language.service';
import { BehaviorSubject, of } from 'rxjs';
import { Task } from '@app/model/task';
import { StaticTask } from '@app/model/static-task';
import { Scope } from '@app/model/scope';
import { signal } from '@angular/core';
import { getTranslocoTestingModule } from '@test-utils/transloco-testing';

class MockTaskService {
  tasks$ = new BehaviorSubject<Task[]>([]);
  toCalendarEvents = vi.fn().mockReturnValue([]);
  getAllCalendarEvents = vi.fn().mockReturnValue([]);
  getTask = vi.fn().mockResolvedValue({});
}

class MockTaskModalService {
  openForEdit = vi.fn();
}

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;
  let mockTaskService: MockTaskService;
  let viewService: ViewService;

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

  const mockApi = {
    invoke: vi.fn().mockResolvedValue({}),
  };

  const mockAuth = {
    authReady$: {
      subscribe: vi.fn(),
    },
    getAccounts: vi.fn().mockReturnValue([]),
    getIdentityData: vi.fn().mockReturnValue({ organizations: [] }),
  };

  const mockWorkSlotPreferenceService = {
    loadPreferences: vi.fn().mockResolvedValue([]),
    preferencesChanged$: of(undefined),
  };

  const mockLanguageService = {
    language: signal('en' as const),
    initialize: vi.fn(),
    setLanguage: vi.fn(),
  };

  const createMockCalendarRef = () => {
    const events: Array<{ remove: ReturnType<typeof vi.fn> }> = [];
    const api = {
      gotoDate: vi.fn(),
      getEvents: () => events,
      addEvent: vi.fn((evt: any) => {
        events.push({ ...evt, remove: vi.fn() });
      }),
      setOption: vi.fn(),
    };
    return {
      getApi: () => api,
    };
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [Calendar, getTranslocoTestingModule()],
      providers: [
        ViewService,
        { provide: TaskService, useClass: MockTaskService },
        { provide: TaskModalService, useClass: MockTaskModalService },
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
        { provide: WorkSlotPreferenceService, useValue: mockWorkSlotPreferenceService },
        { provide: LanguageService, useValue: mockLanguageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    viewService = TestBed.inject(ViewService);

    // Mock the calendar ref before any lifecycle hooks run
    Object.defineProperty(component, 'calendarRef', {
      value: createMockCalendarRef(),
      writable: true,
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call gotoDate via ngAfterViewInit when focusDate is already set', () => {
    const mockCalendarRef = createMockCalendarRef();
    Object.defineProperty(component, 'calendarRef', {
      value: mockCalendarRef,
      writable: true,
    });

    component.focusDate = new Date('2026-05-15');
    component.ngAfterViewInit();

    expect(mockCalendarRef.getApi().gotoDate).toHaveBeenCalledWith(new Date('2026-05-15'));
    expect(viewService.jumpToDate()).toBeNull();
  });

  it('should call gotoDate when focusDate changes via ngOnChanges', () => {
    const mockCalendarRef = createMockCalendarRef();
    Object.defineProperty(component, 'calendarRef', {
      value: mockCalendarRef,
      writable: true,
    });

    component.focusDate = new Date('2026-06-01');
    component.ngOnChanges({
      focusDate: {
        currentValue: new Date('2026-06-01'),
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    } as any);

    expect(mockCalendarRef.getApi().gotoDate).toHaveBeenCalledWith(new Date('2026-06-01'));
    expect(viewService.jumpToDate()).toBeNull();
  });

  // --- filterEffect ---
  it('should refresh events when filter signals change', () => {
    const refreshSpy = vi.spyOn(component as any, 'renderCalendarEvents');

    viewService.selectedOrganizationId.set('org-1');
    fixture.detectChanges();
    expect(refreshSpy).toHaveBeenCalled();

    refreshSpy.mockClear();
    viewService.activeFilter.set({ type: 'label', value: 'work' });
    fixture.detectChanges();
    expect(refreshSpy).toHaveBeenCalled();
  });

  // --- getFilteredEvents ---
  it('should filter events by organization', () => {
    component.tasks = [
      new StaticTask(1, 'Task 1', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
      new StaticTask(2, 'Task 2', '', [], new Scope(new Date(), new Date()), 'org-2', 'easy', false, 'UNSET'),
    ];
    mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

    viewService.selectedOrganizationId.set('org-1');
    const result = (component as any).getFilteredEvents();

    expect(result).toEqual([{ id: 1 }]);
  });

  it('should filter events by label', () => {
    component.tasks = [
      new StaticTask(1, 'Task 1', '', ['work'], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
      new StaticTask(2, 'Task 2', '', ['personal'], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
    ];
    mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

    viewService.activeFilter.set({ type: 'label', value: 'work' });
    const result = (component as any).getFilteredEvents();

    expect(result).toEqual([{ id: 1 }]);
  });

  it('should filter events by task id', () => {
    component.tasks = [
      new StaticTask(1, 'Task 1', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
      new StaticTask(2, 'Task 2', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
    ];
    mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

    viewService.activeFilter.set({ type: 'task', value: 2 });
    const result = (component as any).getFilteredEvents();

    expect(result).toEqual([{ id: 2 }]);
  });
});

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
import { EventClickArg } from '@fullcalendar/core';
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
  getTaskColorMix = vi.fn().mockReturnValue('#000000');
}

class MockTaskModalService {
  openForEdit = vi.fn();
}

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;
  let mockTaskService: MockTaskService;
  let mockTaskModalService: MockTaskModalService;
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
    preferencesChanged$: new BehaviorSubject<void>(undefined),
  };

  const mockLanguageService = {
    language: signal<'en' | 'de'>('en'),
    initialize: vi.fn(),
    setLanguage: vi.fn(),
  };

  const createMockCalendarRef = () => {
    const events: Array<any> = [];
    const options: Record<string, any> = {};
    const api = {
      gotoDate: vi.fn(),
      getEvents: () => events,
      addEvent: vi.fn((evt: any) => {
        events.push({ ...evt, remove: vi.fn() });
      }),
      setOption: vi.fn((key: string, val: any) => {
        options[key] = val;
      }),
      getOption: (key: string) => options[key],
      next: vi.fn(),
      prev: vi.fn(),
      today: vi.fn(),
      changeView: vi.fn(),
    };
    return {
      getApi: () => api,
      _options: options,
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
    mockTaskModalService = TestBed.inject(TaskModalService) as unknown as MockTaskModalService;
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

  // --- renderCalendarEvents ---
  describe('renderCalendarEvents', () => {
    it('should clear existing events and add task events', async () => {
      const mockCalendarRef = createMockCalendarRef();
      Object.defineProperty(component, 'calendarRef', { value: mockCalendarRef, writable: true });
      mockTaskService.getAllCalendarEvents.mockReturnValue([{ id: 'evt-1', title: 'Task Event' }]);
      mockWorkSlotPreferenceService.loadPreferences.mockResolvedValue([]);

      await (component as any).renderCalendarEvents();

      expect(mockCalendarRef.getApi().addEvent).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'evt-1', title: 'Task Event' }),
      );
    });

    it('should add work slot events after loading preferences', async () => {
      const mockCalendarRef = createMockCalendarRef();
      Object.defineProperty(component, 'calendarRef', { value: mockCalendarRef, writable: true });
      mockTaskService.getAllCalendarEvents.mockReturnValue([]);
      mockWorkSlotPreferenceService.loadPreferences.mockResolvedValue([
        { id: 1, dayIndex: 0, startHour: 9, durationHours: 2, colorClass: 'primary' },
      ]);
      mockTaskService.getTaskColorMix.mockReturnValue('rgba(0,0,255,0.35)');

      await (component as any).renderCalendarEvents();

      expect(mockCalendarRef.getApi().addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'work-slot-1',
          daysOfWeek: [1],
          startTime: '09:00:00',
          endTime: '11:00:00',
          display: 'background',
          backgroundColor: 'rgba(0,0,255,0.35)',
        }),
      );
    });

    it('should remove existing events before adding new ones', async () => {
      const mockCalendarRef = createMockCalendarRef();
      Object.defineProperty(component, 'calendarRef', { value: mockCalendarRef, writable: true });
      const existingEvent = { remove: vi.fn() };
      mockCalendarRef.getApi().getEvents().push(existingEvent);
      mockTaskService.getAllCalendarEvents.mockReturnValue([]);
      mockWorkSlotPreferenceService.loadPreferences.mockResolvedValue([]);

      await (component as any).renderCalendarEvents();

      expect(existingEvent.remove).toHaveBeenCalled();
    });

    it('should log error when work slot preferences fail to load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockCalendarRef = createMockCalendarRef();
      Object.defineProperty(component, 'calendarRef', { value: mockCalendarRef, writable: true });
      mockWorkSlotPreferenceService.loadPreferences.mockRejectedValue(new Error('load failed'));
      mockTaskService.getAllCalendarEvents.mockReturnValue([]);

      await (component as any).renderCalendarEvents();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading work slot preferences for calendar:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  // --- eventClick callback ---
  describe('eventClick callback', () => {
    let eventClickHandler: any;

    beforeEach(() => {
      const mockCalendarRef = createMockCalendarRef();
      Object.defineProperty(component, 'calendarRef', { value: mockCalendarRef, writable: true });
      component.ngAfterViewInit();
      eventClickHandler = mockCalendarRef.getApi().setOption.mock.calls.find(
        (call: any[]) => call[0] === 'eventClick',
      )?.[1];
      expect(eventClickHandler).toBeDefined();
    });

    it('should fetch task and open modal for normal events', async () => {
      const task = { id: 1, title: 'Test' };
      mockTaskService.getTask.mockResolvedValue(task);

      await eventClickHandler({
        event: { id: '1-instance', extendedProps: { isWorkSlot: false } },
      } as unknown as EventClickArg);

      expect(mockTaskService.getTask).toHaveBeenCalledWith(1);
      expect(mockTaskModalService.openForEdit).toHaveBeenCalledWith(task);
    });

    it('should ignore work slot events', async () => {
      await eventClickHandler({
        event: { id: 'work-slot-1', extendedProps: { isWorkSlot: true } },
      } as unknown as EventClickArg);

      expect(mockTaskService.getTask).not.toHaveBeenCalled();
      expect(mockTaskModalService.openForEdit).not.toHaveBeenCalled();
    });

    it('should log error when task fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTaskService.getTask.mockRejectedValue(new Error('fetch failed'));

      await eventClickHandler({
        event: { id: '1-instance', extendedProps: { isWorkSlot: false } },
      } as unknown as EventClickArg);

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching task:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // --- getFilteredEvents edge cases ---
  describe('getFilteredEvents edge cases', () => {
    beforeEach(() => {
      viewService.selectedOrganizationId.set(null);
      viewService.activeFilter.set(null);
    });

    it('should return all events when no filter is set', () => {
      component.tasks = [
        new StaticTask(1, 'Task 1', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
        new StaticTask(2, 'Task 2', '', [], new Scope(new Date(), new Date()), 'org-2', 'easy', false, 'UNSET'),
      ];
      mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

      const result = (component as any).getFilteredEvents();

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should apply combined organization and label filters', () => {
      component.tasks = [
        new StaticTask(1, 'Task 1', '', ['work'], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
        new StaticTask(2, 'Task 2', '', ['work'], new Scope(new Date(), new Date()), 'org-2', 'easy', false, 'UNSET'),
        new StaticTask(3, 'Task 3', '', ['personal'], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
      ];
      mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

      viewService.selectedOrganizationId.set('org-1');
      viewService.activeFilter.set({ type: 'label', value: 'work' });

      const result = (component as any).getFilteredEvents();

      expect(result).toEqual([{ id: 1 }]);
    });

    it('should apply combined organization and task id filters', () => {
      component.tasks = [
        new StaticTask(1, 'Task 1', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
        new StaticTask(2, 'Task 2', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
        new StaticTask(3, 'Task 3', '', [], new Scope(new Date(), new Date()), 'org-2', 'easy', false, 'UNSET'),
      ];
      mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

      viewService.selectedOrganizationId.set('org-1');
      viewService.activeFilter.set({ type: 'task', value: 2 });

      const result = (component as any).getFilteredEvents();

      expect(result).toEqual([{ id: 2 }]);
    });

    it('should return empty array when no tasks match filters', () => {
      component.tasks = [
        new StaticTask(1, 'Task 1', '', [], new Scope(new Date(), new Date()), 'org-1', 'easy', false, 'UNSET'),
      ];
      mockTaskService.toCalendarEvents.mockImplementation((task: Task) => [{ id: task.id }]);

      viewService.selectedOrganizationId.set('org-999');

      const result = (component as any).getFilteredEvents();

      expect(result).toEqual([]);
    });
  });

  // --- refreshEvents (maps to requested refreshCalendar) ---
  describe('refreshEvents', () => {
    it('should clear existing events and add filtered events', () => {
      const mockCalendarRef = createMockCalendarRef();
      Object.defineProperty(component, 'calendarRef', { value: mockCalendarRef, writable: true });
      component.tasks = [
        new StaticTask(1, 'Task 1', '', [], new Scope(new Date(), new Date()), null, 'easy', false, 'UNSET'),
      ];
      mockTaskService.toCalendarEvents.mockReturnValue([{ id: 'refreshed-1' }]);

      const existingRemove = vi.fn();
      mockCalendarRef.getApi().getEvents().push({ id: 'old', remove: existingRemove });

      (component as any).refreshEvents();

      expect(existingRemove).toHaveBeenCalled();
      expect(mockCalendarRef.getApi().addEvent).toHaveBeenCalledWith({ id: 'refreshed-1' });
    });
  });

  // --- calendarOptions / language changes ---
  describe('calendarOptions and language changes', () => {
    it('should default to English locale and button text', () => {
      const options = component.calendarOptions();
      expect(options.locale).toBe('en');
      expect(options.buttonText).toEqual({ today: 'today', month: 'month', week: 'week' });
    });

    it('should switch to German locale when language signal changes', () => {
      mockLanguageService.language.set('de');
      const options = component.calendarOptions();
      expect(options.locale).toBe('de');
      expect(options.buttonText).toEqual({ today: 'Heute', month: 'Monat', week: 'Woche' });
    });
  });
});

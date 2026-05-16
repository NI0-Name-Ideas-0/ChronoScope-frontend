import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Calendar } from './calendar';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '@api/api';
import { Auth } from '@services/auth';
import { BehaviorSubject } from 'rxjs';
import { Task } from '@app/model/task';

class MockTaskService {
  tasks$ = new BehaviorSubject<Task[]>([]);
  toCalendarEvents = vi.fn().mockReturnValue([]);
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
      imports: [Calendar],
      providers: [
        ViewService,
        { provide: TaskService, useClass: MockTaskService },
        { provide: TaskModalService, useClass: MockTaskModalService },
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarView } from './calendar-view';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../api/api';
import { TaskModalService } from '@services/task-modal.service';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { LanguageService } from '@services/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { getTranslocoTestingModule } from '@test-utils/transloco-testing';

const mockOAuthService = {
  configure: vi.fn(),
  setStorage: vi.fn(),
  setupAutomaticSilentRefresh: vi.fn(),
  hasValidAccessToken: vi.fn().mockReturnValue(false),
};

const mockAuth = {
  identity$: of(null),
  getIdentityData: vi.fn().mockReturnValue({ organizations: [] }),
  authReady$: of(true),
};

const mockTaskService = {
  tasks$: of([]),
  getTask: vi.fn(),
  getAllCalendarEvents: vi.fn().mockReturnValue([]),
};

const mockTaskModalService = {
  openForEdit: vi.fn(),
};

const mockWorkSlotPreferenceService = {
  loadPreferences: vi.fn().mockResolvedValue([]),
  preferencesChanged$: of(undefined),
};

const mockApi = {
  invoke: vi.fn(),
};

const mockLanguageService = {
  language: signal('en' as const),
  initialize: vi.fn(),
  setLanguage: vi.fn(),
};

describe('CalendarView', () => {
  let component: CalendarView;
  let fixture: ComponentFixture<CalendarView>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CalendarView, getTranslocoTestingModule()],
      providers: [
        ViewService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Auth, useValue: mockAuth },
        { provide: TaskService, useValue: mockTaskService },
        { provide: TaskModalService, useValue: mockTaskModalService },
        { provide: WorkSlotPreferenceService, useValue: mockWorkSlotPreferenceService },
        { provide: Api, useValue: mockApi },
        { provide: LanguageService, useValue: mockLanguageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject viewService', () => {
    expect(component.viewService).toBeInstanceOf(ViewService);
  });
});

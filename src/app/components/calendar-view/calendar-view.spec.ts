import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarView } from './calendar-view';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../api/api';
import { of } from 'rxjs';

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
};

const mockApi = {
  invoke: vi.fn(),
};

describe('CalendarView', () => {
  let component: CalendarView;
  let fixture: ComponentFixture<CalendarView>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CalendarView],
      providers: [
        ViewService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Auth, useValue: mockAuth },
        { provide: TaskService, useValue: mockTaskService },
        { provide: Api, useValue: mockApi },
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

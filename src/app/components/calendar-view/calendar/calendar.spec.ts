import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Calendar } from './calendar';
import { TaskService } from '@services/task.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../../api/api';
import { Auth } from '@services/auth';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
  };

  const mockApi = {
    invoke: vi.fn(),
  };

  const mockAuth = {
    authReady$: {
      subscribe: vi.fn(),
    },
    getAccounts: vi.fn().mockReturnValue([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [
        TaskService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

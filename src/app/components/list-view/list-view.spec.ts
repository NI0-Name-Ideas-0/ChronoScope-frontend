import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListView } from './list-view';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../api/api';
import { Auth } from '@services/auth';

describe('ListView', () => {
  let component: ListView;
  let fixture: ComponentFixture<ListView>;

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
      imports: [ListView],
      providers: [
        TaskService,
        TaskModalService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../api/api';
import { Auth } from './auth';

describe('TaskService', () => {
  let service: TaskService;

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
    loadDiscoveryDocumentAndLogin: vi.fn(),
    events: {
      pipe: () => ({
        subscribe: vi.fn(),
      }),
    },
    loadUserProfile: vi.fn(),
    logOut: vi.fn(),
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

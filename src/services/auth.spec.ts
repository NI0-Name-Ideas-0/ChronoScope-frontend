import { TestBed } from '@angular/core/testing';

import { Auth } from './auth';
import { OAuthService } from 'angular-oauth2-oidc';

describe('Auth', () => {
  let service: Auth;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Auth, { provide: OAuthService, useValue: mockOAuthService }],
    });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

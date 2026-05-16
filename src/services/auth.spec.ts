import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../api/api';

describe('Auth', () => {
  let service: Auth;

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
    loadDiscoveryDocumentAndLogin: vi.fn(),
    events: {
      pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    },
    loadUserProfile: vi.fn(),
    logOut: vi.fn(),
  };

  const mockApi = {
    invoke: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
      ],
    });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call login on oauthService', () => {
    service.login();
    expect(mockOAuthService.loadDiscoveryDocumentAndLogin).toHaveBeenCalled();
  });

  it('should call logOut on oauthService and reset identity', () => {
    service.logout();
    expect(mockOAuthService.logOut).toHaveBeenCalled();
    expect(service.getIdentityData()).toBeNull();
  });

  it('should link account via api', async () => {
    await service.linkAccount('test@example.com');
    expect(mockApi.invoke).toHaveBeenCalled();
  });

  it('should confirm link via api', async () => {
    mockApi.invoke.mockResolvedValue({ success: true });
    const result = await service.confirmLink({ token: 'abc123' });
    expect(mockApi.invoke).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('should return identity data', () => {
    expect(service.getIdentityData()).toBeNull();
  });

  // --- Constructor with valid token ---
  it('should load identity and emit authReady when valid token exists', async () => {
    const validOAuth = {
      ...mockOAuthService,
      hasValidAccessToken: vi.fn().mockReturnValue(true),
    };
    const identityApi = {
      invoke: vi.fn().mockResolvedValue({ organizations: [{ id: 'org-1', name: 'Test' }] }),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: OAuthService, useValue: validOAuth },
        { provide: Api, useValue: identityApi },
      ],
    });
    const newService = TestBed.inject(Auth);

    const readySpy = vi.fn();
    newService.authReady$.subscribe(readySpy);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(identityApi.invoke).toHaveBeenCalled();
    expect(newService.getIdentityData()).toEqual({ organizations: [{ id: 'org-1', name: 'Test' }] });
    expect(readySpy).toHaveBeenCalledWith(true);
  });

  // --- Constructor loadIdentity blob handling ---
  it('should parse blob response when loading identity in constructor', async () => {
    const identity = { organizations: [{ id: 'org-1', name: 'Blob Org' }] };
    const blob = new Blob([JSON.stringify(identity)], { type: 'application/json' });
    const validOAuth = {
      ...mockOAuthService,
      hasValidAccessToken: vi.fn().mockReturnValue(true),
    };
    const blobApi = {
      invoke: vi.fn().mockResolvedValue(blob),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: OAuthService, useValue: validOAuth },
        { provide: Api, useValue: blobApi },
      ],
    });
    const newService = TestBed.inject(Auth);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(newService.getIdentityData()).toEqual(identity);
  });

  // --- login token_received event ---
  it('should load user profile and identity on token_received event', () => {
    const subscribeFn = vi.fn((cb) => {
      cb({ type: 'token_received' });
    });
    const eventOAuth = {
      ...mockOAuthService,
      events: {
        pipe: vi.fn().mockReturnValue({ subscribe: subscribeFn }),
      },
      loadUserProfile: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: OAuthService, useValue: eventOAuth },
        { provide: Api, useValue: mockApi },
      ],
    });
    const newService = TestBed.inject(Auth);

    newService.login();

    expect(eventOAuth.loadUserProfile).toHaveBeenCalled();
    expect(mockApi.invoke).toHaveBeenCalled();
  });
});

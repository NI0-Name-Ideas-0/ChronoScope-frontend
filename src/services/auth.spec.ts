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
});

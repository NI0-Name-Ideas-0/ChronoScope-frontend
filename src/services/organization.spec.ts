import { TestBed } from '@angular/core/testing';
import { Organization } from './organization';
import { Api } from '../api/api';

describe('Organization', () => {
  let service: Organization;

  const mockApi = {
    invoke: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [Organization, { provide: Api, useValue: mockApi }],
    });
    service = TestBed.inject(Organization);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get organization members', async () => {
    const mockResponse = { members: [] };
    mockApi.invoke.mockResolvedValue(mockResponse);
    const result = await service.getOrganizationMembers('org-1');
    expect(mockApi.invoke).toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });

  it('should get organization invitations', async () => {
    const mockResponse = { invitations: [] };
    mockApi.invoke.mockResolvedValue(mockResponse);
    const result = await service.getOrganizationInvitations('org-1');
    expect(mockApi.invoke).toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });

  it('should invite user', async () => {
    await service.inviteUser('org-1', 'user@example.com');
    expect(mockApi.invoke).toHaveBeenCalled();
  });

  it('should resend invitation', async () => {
    await service.resendInvitation('org-1', 'inv-1');
    expect(mockApi.invoke).toHaveBeenCalled();
  });

  it('should delete invitation', async () => {
    await service.deleteInvitation('org-1', 'inv-1');
    expect(mockApi.invoke).toHaveBeenCalled();
  });
});

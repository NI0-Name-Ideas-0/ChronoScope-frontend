import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsSection } from './organizations';
import { Auth } from '@services/auth';
import { Organization } from '@services/organization';
import { Api } from '@api/api';
import { BehaviorSubject } from 'rxjs';
import { IdentityResponse, OrganizationMember, Invitation } from '../../../../../api/models';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('OrganizationsSection', () => {
  let component: OrganizationsSection;
  let fixture: ComponentFixture<OrganizationsSection>;

  const identitySubject = new BehaviorSubject<IdentityResponse | null>({
    organizations: [
      { id: 'org-1', name: 'Chrono Labs' },
      { id: 'org-2', name: 'Test Org' },
    ],
    adminOrganizations: ['org-1'],
  } as IdentityResponse);

  const mockAuth = {
    identity$: identitySubject.asObservable(),
    getIdentityData: vi.fn().mockReturnValue(identitySubject.getValue()),
  };

  const mockOrganizationService = {
    getOrganizationMembers: vi.fn().mockResolvedValue({ members: [] }),
    getOrganizationInvitations: vi.fn().mockResolvedValue({ invitations: [] }),
    inviteUser: vi.fn().mockResolvedValue(undefined),
    resendInvitation: vi.fn().mockResolvedValue(undefined),
    deleteInvitation: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
  };

  const mockApi = {
    invoke: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    identitySubject.next({
      organizations: [
        { id: 'org-1', name: 'Chrono Labs' },
        { id: 'org-2', name: 'Test Org' },
      ],
      adminOrganizations: ['org-1'],
    } as IdentityResponse);
    mockAuth.getIdentityData.mockReturnValue(identitySubject.getValue());

    await TestBed.configureTestingModule({
      imports: [OrganizationsSection, getTranslocoTestingModule()],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: Organization, useValue: mockOrganizationService },
        { provide: Api, useValue: mockApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render organizations from identity', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chrono Labs');
    expect(fixture.nativeElement.textContent).toContain('Test Org');
  });

  it('should show Admin badge for admin organizations', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Admin');
  });

  describe('selectOrganizationToManage', () => {
    it('should select an organization and load members and invitations', async () => {
      identitySubject.next({
        organizations: [
          { id: 'org-1', name: 'Chrono Labs' },
          { id: 'org-2', name: 'Test Org 2' },
        ],
        adminOrganizations: ['org-1', 'org-2'],
        accounts: [],
        id: 1,
      } as IdentityResponse);
      mockAuth.getIdentityData.mockReturnValue(identitySubject.getValue());

      fixture = TestBed.createComponent(OrganizationsSection);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      mockOrganizationService.getOrganizationMembers.mockClear();
      mockOrganizationService.getOrganizationInvitations.mockClear();

      const members: OrganizationMember[] = [
        { id: 'm1', email: 'm1@test.com', firstName: 'John', lastName: 'Doe', userName: 'jdoe' },
      ];
      const invitations: Invitation[] = [
        { id: 'i1', email: 'inv@test.com', expired: false, expiresAt: '', firstName: '', inviteLink: '', lastName: '' },
      ];
      mockOrganizationService.getOrganizationMembers.mockResolvedValueOnce({ members });
      mockOrganizationService.getOrganizationInvitations.mockResolvedValueOnce({ invitations });

      await component.selectOrganizationToManage('org-2');

      expect(component.selectedAdminOrganizationId()).toBe('org-2');
      expect(mockOrganizationService.getOrganizationMembers).toHaveBeenCalledWith('org-2');
      expect(mockOrganizationService.getOrganizationInvitations).toHaveBeenCalledWith('org-2');
      expect(component.organizationMembers()).toEqual(members);
      expect(component.outgoingInvitations()).toEqual(invitations);
      expect(component.loadingManagementData()).toBe(false);
    });

    it('should not select a non-admin organization', async () => {
      await component.selectOrganizationToManage('org-2');
      expect(component.selectedAdminOrganizationId()).not.toBe('org-2');
      expect(mockOrganizationService.getOrganizationMembers).not.toHaveBeenCalledWith('org-2');
    });

    it('should not re-select the already selected organization', async () => {
      component.selectedAdminOrganizationId.set('org-1');
      mockOrganizationService.getOrganizationMembers.mockClear();

      await component.selectOrganizationToManage('org-1');

      expect(mockOrganizationService.getOrganizationMembers).not.toHaveBeenCalled();
    });

    it('should handle undefined organizationId', async () => {
      await component.selectOrganizationToManage(undefined);
      expect(component.selectedAdminOrganizationId()).toBe('org-1');
    });
  });

  describe('inviteMember', () => {
    it('should send invite, reset email, and reload management data', async () => {
      component.selectedAdminOrganizationId.set('org-1');
      component.inviteEmail.set('new@user.com');
      mockOrganizationService.getOrganizationMembers.mockResolvedValueOnce({ members: [] });
      mockOrganizationService.getOrganizationInvitations.mockResolvedValueOnce({ invitations: [] });

      const promise = component.inviteMember();
      expect(component.inviting()).toBe(true);

      await promise;

      expect(mockOrganizationService.inviteUser).toHaveBeenCalledWith('org-1', 'new@user.com');
      expect(component.inviteEmail()).toBe('');
      expect(component.inviting()).toBe(false);
      expect(mockOrganizationService.getOrganizationMembers).toHaveBeenCalled();
      expect(mockOrganizationService.getOrganizationInvitations).toHaveBeenCalled();
    });

    it('should not invite when no organization is selected', async () => {
      component.selectedAdminOrganizationId.set(null);
      component.inviteEmail.set('new@user.com');

      await component.inviteMember();

      expect(mockOrganizationService.inviteUser).not.toHaveBeenCalled();
    });

    it('should not invite when email is empty or whitespace only', async () => {
      component.selectedAdminOrganizationId.set('org-1');
      component.inviteEmail.set('   ');

      await component.inviteMember();

      expect(mockOrganizationService.inviteUser).not.toHaveBeenCalled();
    });

    it('should not invite while another invite is in progress', async () => {
      component.selectedAdminOrganizationId.set('org-1');
      component.inviteEmail.set('new@user.com');
      component.inviting.set(true);

      await component.inviteMember();

      expect(mockOrganizationService.inviteUser).not.toHaveBeenCalled();
    });

    it('should handle invite errors and reset inviting state', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.selectedAdminOrganizationId.set('org-1');
      component.inviteEmail.set('fail@user.com');
      mockOrganizationService.inviteUser.mockRejectedValueOnce(new Error('Invite failed'));

      await component.inviteMember();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to invite member:', expect.any(Error));
      expect(component.inviting()).toBe(false);
      expect(component.inviteEmail()).toBe('fail@user.com');
      consoleSpy.mockRestore();
    });
  });

  describe('kickMember', () => {
    it('should remove a member and reload management data', async () => {
      const member: OrganizationMember = {
        id: 'm1',
        email: 'm1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
      };
      component.selectedAdminOrganizationId.set('org-1');
      mockOrganizationService.getOrganizationMembers.mockResolvedValueOnce({ members: [] });
      mockOrganizationService.getOrganizationInvitations.mockResolvedValueOnce({ invitations: [] });

      await component.kickMember(member);

      expect(mockOrganizationService.removeMember).toHaveBeenCalledWith('org-1', 'm1');
      expect(component.memberActionUserId()).toBe(null);
      expect(mockOrganizationService.getOrganizationMembers).toHaveBeenCalled();
    });

    it('should not kick when no organization is selected', async () => {
      const member: OrganizationMember = {
        id: 'm1',
        email: 'm1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
      };
      component.selectedAdminOrganizationId.set(null);

      await component.kickMember(member);

      expect(mockOrganizationService.removeMember).not.toHaveBeenCalled();
    });

    it('should not kick while another member action is in progress', async () => {
      const member: OrganizationMember = {
        id: 'm1',
        email: 'm1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
      };
      component.selectedAdminOrganizationId.set('org-1');
      component.memberActionUserId.set('other');

      await component.kickMember(member);

      expect(mockOrganizationService.removeMember).not.toHaveBeenCalled();
    });

    it('should handle kick errors and reset memberActionUserId', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const member: OrganizationMember = {
        id: 'm2',
        email: 'm2@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        userName: 'janedoe',
      };
      component.selectedAdminOrganizationId.set('org-1');
      mockOrganizationService.removeMember.mockRejectedValueOnce(new Error('Kick failed'));

      await component.kickMember(member);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove organization member:', expect.any(Error));
      expect(component.memberActionUserId()).toBe(null);
      consoleSpy.mockRestore();
    });
  });

  describe('resendInvite', () => {
    it('should resend an invitation', async () => {
      const invitation: Invitation = {
        id: 'i1',
        email: 'invite@test.com',
        expired: false,
        expiresAt: '',
        firstName: '',
        inviteLink: '',
        lastName: '',
      };
      component.selectedAdminOrganizationId.set('org-1');

      await component.resendInvite(invitation);

      expect(mockOrganizationService.resendInvitation).toHaveBeenCalledWith('org-1', 'i1');
      expect(component.invitationActionId()).toBe(null);
    });

    it('should not resend while another invitation action is in progress', async () => {
      const invitation: Invitation = {
        id: 'i1',
        email: 'invite@test.com',
        expired: false,
        expiresAt: '',
        firstName: '',
        inviteLink: '',
        lastName: '',
      };
      component.selectedAdminOrganizationId.set('org-1');
      component.invitationActionId.set('other');

      await component.resendInvite(invitation);

      expect(mockOrganizationService.resendInvitation).not.toHaveBeenCalled();
    });

    it('should handle resend errors and reset invitationActionId', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invitation: Invitation = {
        id: 'i2',
        email: 'invite2@test.com',
        expired: false,
        expiresAt: '',
        firstName: '',
        inviteLink: '',
        lastName: '',
      };
      component.selectedAdminOrganizationId.set('org-1');
      mockOrganizationService.resendInvitation.mockRejectedValueOnce(new Error('Resend failed'));

      await component.resendInvite(invitation);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to resend invitation:', expect.any(Error));
      expect(component.invitationActionId()).toBe(null);
      consoleSpy.mockRestore();
    });
  });

  describe('cancelInvite', () => {
    it('should delete an invitation and remove it from the list', async () => {
      const invitation: Invitation = {
        id: 'i1',
        email: 'invite@test.com',
        expired: false,
        expiresAt: '',
        firstName: '',
        inviteLink: '',
        lastName: '',
      };
      component.selectedAdminOrganizationId.set('org-1');
      component.outgoingInvitations.set([invitation]);

      await component.cancelInvite(invitation);

      expect(mockOrganizationService.deleteInvitation).toHaveBeenCalledWith('org-1', 'i1');
      expect(component.outgoingInvitations()).toEqual([]);
      expect(component.invitationActionId()).toBe(null);
    });

    it('should handle cancel errors and reset invitationActionId', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invitation: Invitation = {
        id: 'i2',
        email: 'invite2@test.com',
        expired: false,
        expiresAt: '',
        firstName: '',
        inviteLink: '',
        lastName: '',
      };
      component.selectedAdminOrganizationId.set('org-1');
      component.outgoingInvitations.set([invitation]);
      mockOrganizationService.deleteInvitation.mockRejectedValueOnce(new Error('Cancel failed'));

      await component.cancelInvite(invitation);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to cancel invitation:', expect.any(Error));
      expect(component.invitationActionId()).toBe(null);
      consoleSpy.mockRestore();
    });
  });

  describe('setOrganizationColor', () => {
    it('should update organization color successfully', async () => {
      mockApi.invoke.mockResolvedValueOnce(undefined);
      component.colors.set({ 'org-1': 'BLUE' });

      await component.setOrganizationColor('org-1', 'RED');

      expect(mockApi.invoke).toHaveBeenCalled();
      expect(component.colors()['org-1']).toBe('RED');
      expect(component.openPopoverOrgId()).toBe(null);
      expect(component.savingOrgId()).toBe(null);
    });

    it('should handle color update errors and reset savingOrgId', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.invoke.mockRejectedValueOnce(new Error('Color update failed'));

      await component.setOrganizationColor('org-1', 'GREEN');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update organization color:', expect.any(Error));
      expect(component.savingOrgId()).toBe(null);
      consoleSpy.mockRestore();
    });

    it('should not update color when orgId is missing', async () => {
      mockApi.invoke.mockClear();
      await component.setOrganizationColor(undefined, 'RED');
      expect(mockApi.invoke).not.toHaveBeenCalled();
    });

    it('should not update color when color is UNSET', async () => {
      mockApi.invoke.mockClear();
      await component.setOrganizationColor('org-1', 'UNSET');
      expect(mockApi.invoke).not.toHaveBeenCalled();
    });

    it('should not update color while another save is in progress', async () => {
      component.savingOrgId.set('org-1');
      mockApi.invoke.mockClear();

      await component.setOrganizationColor('org-1', 'RED');

      expect(mockApi.invoke).not.toHaveBeenCalled();
    });
  });

  describe('isAdminOrganization', () => {
    it('should return true for admin organizations', () => {
      expect(component.isAdminOrganization('org-1')).toBe(true);
    });

    it('should return false for non-admin organizations', () => {
      expect(component.isAdminOrganization('org-2')).toBe(false);
    });

    it('should return false for undefined organizationId', () => {
      expect(component.isAdminOrganization(undefined)).toBe(false);
    });
  });

  describe('getAdminOrganizations', () => {
    it('should return only organizations where user is admin', () => {
      const adminOrgs = component.getAdminOrganizations();
      expect(adminOrgs).toHaveLength(1);
      expect(adminOrgs[0].id).toBe('org-1');
    });

    it('should return empty array when user has no admin organizations', () => {
      identitySubject.next({
        organizations: [
          { id: 'org-1', name: 'Chrono Labs' },
        ],
        adminOrganizations: [],
        accounts: [],
        id: 1,
      } as IdentityResponse);
      mockAuth.getIdentityData.mockReturnValue(identitySubject.getValue());

      expect(component.getAdminOrganizations()).toEqual([]);
    });
  });

  describe('getOrganizationColor', () => {
    it('should return configured color when set and not UNSET', () => {
      component.colors.set({ 'org-1': 'RED' });
      expect(component.getOrganizationColor('org-1')).toBe('RED');
    });

    it('should return rotation color when not configured', () => {
      const color1 = component.getOrganizationColor('org-1');
      const color2 = component.getOrganizationColor('org-2');
      expect(color1).not.toBe('UNSET');
      expect(color2).not.toBe('UNSET');
      expect(color1).not.toBe(color2);
    });

    it('should return BLUE for unknown org', () => {
      expect(component.getOrganizationColor('unknown')).toBe('BLUE');
    });

    it('should return BLUE for undefined orgId', () => {
      expect(component.getOrganizationColor(undefined)).toBe('BLUE');
    });

    it('should fall through to rotation when configured color is UNSET', () => {
      component.colors.set({ 'org-1': 'UNSET' });
      const color = component.getOrganizationColor('org-1');
      expect(color).not.toBe('UNSET');
    });
  });

  describe('togglePopover', () => {
    it('should open popover for an organization', () => {
      component.togglePopover('org-1');
      expect(component.openPopoverOrgId()).toBe('org-1');
    });

    it('should close popover when toggling the same organization', () => {
      component.openPopoverOrgId.set('org-1');
      component.togglePopover('org-1');
      expect(component.openPopoverOrgId()).toBe(null);
    });

    it('should switch popover to another organization', () => {
      component.openPopoverOrgId.set('org-1');
      component.togglePopover('org-2');
      expect(component.openPopoverOrgId()).toBe('org-2');
    });

    it('should not toggle for undefined orgId', () => {
      component.openPopoverOrgId.set('org-1');
      component.togglePopover(undefined);
      expect(component.openPopoverOrgId()).toBe('org-1');
    });
  });

  describe('getMemberDisplayName', () => {
    it('should return full name when available', () => {
      const member: OrganizationMember = {
        id: 'm1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@doe.com',
        userName: 'jdoe',
      };
      expect(component.getMemberDisplayName(member)).toBe('John Doe');
    });

    it('should fall back to userName when full name is missing', () => {
      const member: OrganizationMember = {
        id: 'm1',
        firstName: '',
        lastName: '',
        email: 'john@doe.com',
        userName: 'jdoe',
      };
      expect(component.getMemberDisplayName(member)).toBe('jdoe');
    });

    it('should fall back to email when full name and userName are missing', () => {
      const member: OrganizationMember = {
        id: 'm1',
        firstName: '',
        lastName: '',
        email: 'john@doe.com',
        userName: '',
      };
      expect(component.getMemberDisplayName(member)).toBe('john@doe.com');
    });
  });

  describe('constructor initialization', () => {
    it('should load organization colors on init', async () => {
      await fixture.whenStable();
      expect(mockApi.invoke).toHaveBeenCalled();
    });

    it('should select the first admin organization and load management data', async () => {
      await fixture.whenStable();
      expect(component.selectedAdminOrganizationId()).toBe('org-1');
      expect(mockOrganizationService.getOrganizationMembers).toHaveBeenCalledWith('org-1');
      expect(mockOrganizationService.getOrganizationInvitations).toHaveBeenCalledWith('org-1');
    });

    it('should not select any organization when user is not an admin', async () => {
      vi.clearAllMocks();
      identitySubject.next({
        organizations: [
          { id: 'org-1', name: 'Chrono Labs' },
        ],
        adminOrganizations: [],
        accounts: [],
        id: 1,
      } as IdentityResponse);
      mockAuth.getIdentityData.mockReturnValue(identitySubject.getValue());

      fixture = TestBed.createComponent(OrganizationsSection);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedAdminOrganizationId()).toBe(null);
      expect(mockOrganizationService.getOrganizationMembers).not.toHaveBeenCalled();
    });
  });
});

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '@services/auth';
import { AsyncPipe } from '@angular/common';
import { Api } from '@api/api';
import { TaskColor } from '@app/model/task';
import { Organization as OrganizationService } from '@services/organization';
import { getOrganizationColors } from '../../../../../api/fn/identity/get-organization-colors';
import { updateOrganizationColor } from '../../../../../api/fn/identity/update-organization-color';
import { IdentityOrganizationColorResponse, Invitation, OrganizationMember, Organization as IdentityOrganization } from '../../../../../api/models';

const ORGANIZATION_COLORS: TaskColor[] = [
  'RED',
  'ORANGE',
  'AMBER',
  'YELLOW',
  'GREEN',
  'MINT',
  'CYAN',
  'BLUE',
  'INDIGO',
  'PURPLE',
  'PINK',
  'BROWN',
  'GRAY',
];

@Component({
  selector: 'app-settings-organizations',
  imports: [FormsModule, AsyncPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsSection {
  protected authService = inject(Auth);
  private api = inject(Api);
  private organizationService = inject(OrganizationService);

  colors = signal<Record<string, TaskColor>>({});
  openPopoverOrgId = signal<string | null>(null);
  savingOrgId = signal<string | null>(null);
  selectedAdminOrganizationId = signal<string | null>(null);
  organizationMembers = signal<OrganizationMember[]>([]);
  outgoingInvitations = signal<Invitation[]>([]);
  inviteEmail = signal('');
  loadingManagementData = signal(false);
  inviting = signal(false);
  memberActionUserId = signal<string | null>(null);
  invitationActionId = signal<string | null>(null);

  readonly colorOptions = ORGANIZATION_COLORS;

  constructor() {
    this.loadOrganizationColors();
    this.initializeSelectedOrganization();
  }

  private initializeSelectedOrganization(): void {
    const adminOrganizations = this.getAdminOrganizations();
    if (!adminOrganizations.length) {
      return;
    }
    const firstOrganizationId = adminOrganizations[0].id;
    if (!firstOrganizationId) {
      return;
    }
    this.selectedAdminOrganizationId.set(firstOrganizationId);
    void this.loadManagementData(firstOrganizationId);
  }

  private getAdminOrganizationIds(): string[] {
    return this.authService.getIdentityData()?.adminOrganizations ?? [];
  }

  getAdminOrganizations(): IdentityOrganization[] {
    const identity = this.authService.getIdentityData();
    const adminOrgIds = new Set(identity?.adminOrganizations ?? []);
    return (identity?.organizations ?? []).filter((organization) => !!organization.id && adminOrgIds.has(organization.id));
  }

  isAdminOrganization(organizationId: string | undefined): boolean {
    if (!organizationId) {
      return false;
    }
    return this.getAdminOrganizationIds().includes(organizationId);
  }

  async selectOrganizationToManage(organizationId: string | undefined): Promise<void> {
    if (!organizationId || !this.isAdminOrganization(organizationId) || this.selectedAdminOrganizationId() === organizationId) {
      return;
    }

    this.selectedAdminOrganizationId.set(organizationId);
    await this.loadManagementData(organizationId);
  }

  private async loadManagementData(organizationId: string): Promise<void> {
    this.loadingManagementData.set(true);
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        this.organizationService.getOrganizationMembers(organizationId),
        this.organizationService.getOrganizationInvitations(organizationId),
      ]);
      this.organizationMembers.set(membersResponse?.members ?? []);
      this.outgoingInvitations.set(invitationsResponse?.invitations ?? []);
    } catch (error) {
      console.error('Failed to load organization management data:', error);
      this.organizationMembers.set([]);
      this.outgoingInvitations.set([]);
    } finally {
      this.loadingManagementData.set(false);
    }
  }

  private async parseBlob<T>(response: T): Promise<T> {
    const blob = response as Blob;
    if (!(blob instanceof Blob)) {
      return response;
    }
    const jsonText = await blob.text();
    return JSON.parse(jsonText) as T;
  }

  private async loadOrganizationColors(): Promise<void> {
    try {
      const response = await this.api.invoke(getOrganizationColors, {});
      const colors = await this.parseBlob<IdentityOrganizationColorResponse[]>(response);
      const map: Record<string, TaskColor> = {};
      (colors || []).forEach((entry) => {
        if (entry.organizationId) {
          map[entry.organizationId] = entry.color as TaskColor;
        }
      });
      this.colors.set(map);
    } catch (error) {
      console.error('Failed to load organization colors:', error);
    }
  }

  getOrganizationColor(orgId: string | undefined): TaskColor {
    if (!orgId) {
      return 'BLUE';
    }
    const configured = this.colors()[orgId];
    if (configured && configured !== 'UNSET') {
      return configured;
    }

    const orgs = this.authService.getIdentityData()?.organizations ?? [];
    const index = orgs.findIndex((org) => org.id === orgId);
    if (index === -1) {
      return 'BLUE';
    }
    return ORGANIZATION_COLORS[index % ORGANIZATION_COLORS.length] ?? 'BLUE';
  }

  togglePopover(orgId: string | undefined): void {
    if (!orgId) {
      return;
    }
    this.openPopoverOrgId.set(this.openPopoverOrgId() === orgId ? null : orgId);
  }

  async setOrganizationColor(orgId: string | undefined, color: TaskColor): Promise<void> {
    if (!orgId || this.savingOrgId() || color === 'UNSET') {
      return;
    }

    this.savingOrgId.set(orgId);
    try {
      await this.api.invoke(updateOrganizationColor, {
        organizationId: orgId,
        body: { color },
      });

      this.colors.update((prev) => {
        const next = { ...prev };
        next[orgId] = color;
        return next;
      });
      this.openPopoverOrgId.set(null);
    } catch (error) {
      console.error('Failed to update organization color:', error);
    } finally {
      this.savingOrgId.set(null);
    }
  }

  async inviteMember(): Promise<void> {
    const organizationId = this.selectedAdminOrganizationId();
    const email = this.inviteEmail().trim();
    if (!organizationId || !email || this.inviting()) {
      return;
    }

    this.inviting.set(true);
    try {
      await this.organizationService.inviteUser(organizationId, email);
      this.inviteEmail.set('');
      await this.loadManagementData(organizationId);
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      this.inviting.set(false);
    }
  }

  async kickMember(member: OrganizationMember): Promise<void> {
    const organizationId = this.selectedAdminOrganizationId();
    if (!organizationId || !member.id || this.memberActionUserId()) {
      return;
    }

    this.memberActionUserId.set(member.id);
    try {
      await this.organizationService.removeMember(organizationId, member.id);
      await this.loadManagementData(organizationId);
    } catch (error) {
      console.error('Failed to remove organization member:', error);
    } finally {
      this.memberActionUserId.set(null);
    }
  }

  async resendInvite(invitation: Invitation): Promise<void> {
    const organizationId = this.selectedAdminOrganizationId();
    if (!organizationId || !invitation.id || this.invitationActionId()) {
      return;
    }

    this.invitationActionId.set(invitation.id);
    try {
      await this.organizationService.resendInvitation(organizationId, invitation.id);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    } finally {
      this.invitationActionId.set(null);
    }
  }

  async cancelInvite(invitation: Invitation): Promise<void> {
    const organizationId = this.selectedAdminOrganizationId();
    if (!organizationId || !invitation.id || this.invitationActionId()) {
      return;
    }

    this.invitationActionId.set(invitation.id);
    try {
      await this.organizationService.deleteInvitation(organizationId, invitation.id);
      this.outgoingInvitations.update((invitations) => invitations.filter((item) => item.id !== invitation.id));
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    } finally {
      this.invitationActionId.set(null);
    }
  }

  getMemberDisplayName(member: OrganizationMember): string {
    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    return fullName || member.userName || member.email;
  }
}

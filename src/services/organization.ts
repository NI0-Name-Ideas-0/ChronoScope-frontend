import { inject, Injectable } from '@angular/core';
import { Api } from 'api/api';
import { deleteInvitation, DeleteInvitation$Params, getInvitations, GetInvitations$Params, getOrganizationMembers, GetOrganizationMembers$Params, inviteUser, InviteUser$Params, removeMember, RemoveMember$Params, resendInvitation, ResendInvitation$Params } from 'api/functions';
import { OrganizationInvitationsResponse, OrganizationMembersResponse } from 'api/models';

@Injectable({
  providedIn: 'root',
})
export class Organization {

  private api = inject(Api);

  private async parseBlob<T>(response: T): Promise<T> {
    const blob = response as Blob;
    if (!(blob instanceof Blob)) {
      return response;
    }

    const jsonText = await blob.text();
    return JSON.parse(jsonText) as T;
  }
  
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMembersResponse> {
    try {
      const params: GetOrganizationMembers$Params= {organizationId};
      const response = await this.api.invoke(getOrganizationMembers, params);
      return this.parseBlob<OrganizationMembersResponse>(response);
    } catch (error) {
      console.error('Error fetching organization members:', error);
      throw error;
    }
  }
  
  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitationsResponse> {
    try {
      const params: GetInvitations$Params= {organizationId};
      const response = await this.api.invoke(getInvitations, params);
      return this.parseBlob<OrganizationInvitationsResponse>(response);
    } catch (error) {
      console.error('Error fetching organization invitations:', error);
      throw error;
    }
  }
  
  async inviteUser(organizationId: string, targetMail: string): Promise<void> {
    try {
      const params: InviteUser$Params= {organizationId, body: {targetMail} };
      await this.api.invoke(inviteUser, params);
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  async removeMember(organizationId: string, memberId: string): Promise<void> {
    try {
      const params: RemoveMember$Params = { organizationId, id: memberId };
      await this.api.invoke(removeMember, params);
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }
  
  async resendInvitation(organizationId: string, invitationId: string): Promise<void> {
    try {
      const params: ResendInvitation$Params= {organizationId, invitationId };
      await this.api.invoke(resendInvitation, params);
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }
  
  async deleteInvitation(organizationId: string, invitationId: string): Promise<void> {
    try {
      const params: DeleteInvitation$Params= {organizationId, invitationId };
      await this.api.invoke(deleteInvitation, params);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  }
}

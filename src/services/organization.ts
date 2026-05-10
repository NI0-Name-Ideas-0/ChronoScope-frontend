import { inject, Injectable } from '@angular/core';
import { Api } from 'api/api';
import { Auth } from './auth';
import { deleteInvitation, DeleteInvitation$Params, getInvitations, GetInvitations$Params, getOrganizationMembers, GetOrganizationMembers$Params, inviteUser, InviteUser$Params, resendInvitation, ResendInvitation$Params } from 'api/functions';
import { OrganizationInvitationsResponse, OrganizationMembersResponse } from 'api/models';

@Injectable({
  providedIn: 'root',
})
export class Organization {

  private api = inject(Api);
  
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMembersResponse> {
    try {
      const params: GetOrganizationMembers$Params= {organizationId};
      return await this.api.invoke(getOrganizationMembers, params);
    } catch (error) {
      console.error('Error fetching organization members:', error);
      throw error;
    }
  }
  
  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitationsResponse> {
    try {
      const params: GetInvitations$Params= {organizationId};
      return await this.api.invoke(getInvitations, params);
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

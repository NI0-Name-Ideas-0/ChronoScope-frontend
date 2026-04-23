import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';
import { Api } from '../api/api';
import { getIdentity, GetIdentity$Params } from '../api/functions';
import { AccountResponse, IdentityResponse } from '../api/models';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private accounts = new BehaviorSubject<AccountResponse[]>([]);
  accounts$ = this.accounts.asObservable();

  private identity = new BehaviorSubject<IdentityResponse | null>(null);
  identity$ = this.identity.asObservable();

  private authReady = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReady.asObservable();

  constructor(
    private oauthService: OAuthService,
    private api: Api,
  ) {
    this.oauthService.configure({
      // Url of the Identity Provider
      issuer: 'https://auth.ni0.team/realms/ni0',

      loginUrl: 'https://auth.ni0.team/realms/ni0/protocol/openid-connect/auth',
      tokenEndpoint: 'https://auth.ni0.team/realms/ni0/protocol/openid-connect/token',
      userinfoEndpoint: 'https://auth.ni0.team/realms/ni0/protocol/openid-connect/userinfo',

      // URL of the SPA to redirect the user to after login
      redirectUri: window.location.origin,

      // The SPA's id. The SPA is registerd with this id at the auth-server
      // clientId: 'server.code',
      clientId: 'chronoscope',

      responseType: 'code',

      // set the scope for the permissions the client should request
      // The first four are defined by OIDC.
      // Important: Request offline_access to get a refresh token
      // The api scope is a usecase specific one
      scope: 'openid roles profile email organization',

      showDebugInformation: true,
    });
    this.oauthService.setStorage(localStorage); // persists across reloads
    this.oauthService.setupAutomaticSilentRefresh();

    // Load identity on app initialization if already logged in
    if (this.oauthService.hasValidAccessToken()) {
      this.loadIdentity()
        .then(() => {
          this.authReady.next(true);
        })
        .catch((error) => {
          console.error('Failed to load identity on app init:', error);
          throw new Error('Failed to load user accounts. Please refresh the page.');
        });
    }
  }

  login() {
    this.oauthService.loadDiscoveryDocumentAndLogin();

    this.oauthService.events
      .pipe(filter((e) => e.type === 'token_received'))
      .subscribe(async (_) => {
        this.oauthService.loadUserProfile();
        try {
          await this.loadIdentity();
          this.authReady.next(true);
        } catch (error) {
          console.error('Failed to load identity after login:', error);
          throw error;
        }
      });
  }

  logout() {
    this.oauthService.logOut();
    this.accounts.next([]);
    this.identity.next(null);
  }

  /**
   * Fetches the user's identity and connected accounts from the backend
   * @throws Error if the identity fetch fails
   */
  private async loadIdentity(): Promise<void> {
    try {
      const params: GetIdentity$Params = {};
      const response = await this.api.invoke(getIdentity, params);

      // Handle blob response - parse it as JSON if it's a Blob
      let identityData = response;
      if (response instanceof Blob) {
        const jsonText = await response.text();
        identityData = JSON.parse(jsonText);
      }

      this.identity.next(identityData);
      this.accounts.next(identityData.accounts || []);
    } catch (error) {
      console.error('Error fetching identity:', error);
      throw error;
    }
  }

  /**
   * Gets the current accounts array
   * @returns Array of connected accounts
   */
  getAccounts(): AccountResponse[] {
    return this.accounts.getValue();
  }

  /**
   * Gets the current identity
   * @returns The current identity or null if not loaded
   */
  getIdentityData(): IdentityResponse | null {
    return this.identity.getValue();
  }

  /**
   * Gets the human-readable name for an account by its ID
   * @param accountId The account ID to look up
   * @returns The account name (from organizations) or a fallback "Account {id}" string
   */
  getAccountNameById(accountId: number): string {
    const account = this.accounts.getValue().find((a) => a.id === accountId);
    if (!account?.organizations?.[0]?.name) {
      return `Account ${accountId}`;
    }
    return account.organizations.map((org) => org.name).join(', ');
  }
}

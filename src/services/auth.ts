import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Auth {

	constructor(private oauthService: OAuthService) {
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
	}

	login() {
    	console.log("Redirecting");
        this.oauthService.loadDiscoveryDocumentAndLogin();

        this.oauthService.events
          .pipe(filter((e) => e.type === 'token_received'))
          .subscribe((_) => this.oauthService.loadUserProfile());
	}

	logout() {
		this.oauthService.logOut();
	}

}

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideApiConfiguration } from '../api/api-configuration';
import { environment } from '../environments/environment';
import { oauthInterceptor } from './interceptors/oauth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([oauthInterceptor])),
    provideApiConfiguration(environment.apiUrl),
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['https://chronoscope.ni0.team', 'http://localhost:8080'],
        sendAccessToken: true,
      },
    }),
  ],
};

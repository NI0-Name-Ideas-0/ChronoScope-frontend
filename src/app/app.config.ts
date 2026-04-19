import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideApiConfiguration } from '../api/api-configuration';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideApiConfiguration(environment.apiUrl),
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['https://chronoscope.ni0.team'],
        sendAccessToken: true,
      },
    }),
  ],
};

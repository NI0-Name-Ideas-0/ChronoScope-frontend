import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideOAuthClient } from 'angular-oauth2-oidc';;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideOAuthClient({
        resourceServer: {
            allowedUrls: ['https://chronoscope.ni0.team'],
            sendAccessToken: true
        }
    })
  ]
};

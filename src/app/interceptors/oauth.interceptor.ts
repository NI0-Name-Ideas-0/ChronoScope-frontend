import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

export const oauthInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);

  // Check if the request URL is in the allowed URLs list
  const allowedUrls = ['https://chronoscope.ni0.team', 'http://localhost:8080'];
  const isAllowedUrl = allowedUrls.some((url) => req.url.startsWith(url));

  if (isAllowedUrl) {
    const token = oauthService.getAccessToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
    }
  }

  return next(req);
};

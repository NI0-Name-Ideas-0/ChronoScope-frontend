import { inject, Injectable } from '@angular/core';
import { Api } from 'api/api';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Organization {

  private authService = inject(Auth);
  private api = inject(Api);

  /*
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
    } catch (error) {
      console.error('Error fetching identity:', error);
      throw error;
    }
  }*/
}

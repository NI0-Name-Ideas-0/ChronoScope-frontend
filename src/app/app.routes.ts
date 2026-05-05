import { Routes } from '@angular/router';
import { LinkAccount } from '@app/components/link-account/link-account';
import { Main } from '@app/components/main/main';

export const routes: Routes = [
  {
    path: 'link-account',
    component: LinkAccount,
  },
  {
    path: '**',
    component: Main
  }
];

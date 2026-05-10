import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@services/auth';

@Component({
  selector: 'app-settings-account-security',
  imports: [FormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-security.html',
})
export class AccountSecuritySection {
  mergeEmail = '';
  protected authService = inject(Auth);

  requestLinkEmail(): void {
    this.authService.linkAccount(this.mergeEmail);
  }
}

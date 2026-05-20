import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '@services/auth';
import { FormFieldComponent } from '@app/components/shared/form-field/form-field';

@Component({
  selector: 'app-settings-account-security',
  imports: [FormsModule, AsyncPipe, TranslocoPipe, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-security.html',
})
export class AccountSecuritySection {
  mergeEmail = '';
  mergeSubmitted = signal(false);
  protected authService = inject(Auth);

  requestLinkEmail(): void {
    this.mergeSubmitted.set(true);
    if (!this.mergeEmail || !this.isValidEmail) return;
    this.authService.linkAccount(this.mergeEmail);
    this.mergeSubmitted.set(false);
    this.mergeEmail = '';
  }

  get isValidEmail(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(this.mergeEmail);
  }
}

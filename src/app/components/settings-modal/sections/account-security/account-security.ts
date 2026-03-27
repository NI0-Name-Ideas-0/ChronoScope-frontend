import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-account-security',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-base-content">Account &amp; Security</h2>
        <p class="text-sm text-base-content/60 mt-0.5">Manage your account details and security settings.</p>
      </div>

      <!-- Email -->
      <div class="settings-card">
        <h3 class="settings-card-title">Email Address</h3>
        <p class="settings-card-desc">Your primary email used for login and notifications.</p>
        <div class="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            [(ngModel)]="email"
            class="input input-bordered flex-1 bg-base-100"
            placeholder="you@example.com"
            aria-label="Email address"
          />
          <button class="btn btn-primary btn-sm self-start sm:self-auto" type="button">
            Save Email
          </button>
        </div>
      </div>

      <!-- Password -->
      <div class="settings-card">
        <h3 class="settings-card-title">Password</h3>
        <p class="settings-card-desc">Reset your password via a secure email link.</p>
        <div class="mt-4">
          <button class="btn btn-outline btn-sm" type="button">
            Send Password Reset Email
          </button>
        </div>
      </div>

      <!-- 2FA -->
      <div class="settings-card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="settings-card-title">Two-Factor Authentication</h3>
            <p class="settings-card-desc">Add an extra layer of security to your account.</p>
          </div>
          <label class="flex items-center cursor-pointer gap-2 shrink-0" aria-label="Toggle two-factor authentication">
            <input
              type="checkbox"
              [(ngModel)]="twoFactorEnabled"
              class="toggle toggle-primary"
              role="switch"
              [attr.aria-checked]="twoFactorEnabled"
            />
          </label>
        </div>
        @if (twoFactorEnabled) {
          <div class="mt-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
            Two-factor authentication is <strong>enabled</strong>. You will be prompted for a code on each login.
          </div>
        }
      </div>
    </div>
  `,
})
export class AccountSecuritySection {
  email = 'user@example.com';
  twoFactorEnabled = false;
}

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';
import { AccountSecuritySection } from './sections/account-security/account-security';
import { AppearanceSection } from './sections/appearance/appearance';
import { OrganizationsSection } from './sections/organizations/organizations';
import { WorkPreferencesSection } from './sections/work-preferences/work-preferences';
import { NotificationsSection } from './sections/notifications/notifications';
import { DataPrivacySection } from './sections/data-privacy/data-privacy';
import { SafeHtmlPipe } from '@pipes/safeHtml.pipe';

type SettingsCategory =
  | 'account'
  | 'appearance'
  | 'organizations'
  | 'work'
  | 'notifications'
  | 'privacy';

interface NavItem {
  id: SettingsCategory;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings-modal',
  imports: [
    AccountSecuritySection,
    AppearanceSection,
    OrganizationsSection,
    WorkPreferencesSection,
    NotificationsSection,
    DataPrivacySection,
    SafeHtmlPipe
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.css',
})
export class SettingsModal {
  open = input.required<boolean>();
  closed = output<void>();

  isLeaving = signal(false);
  activeCategory = signal<SettingsCategory>('account');

  readonly navItems: NavItem[] = [
    {
      id: 'account',
      label: 'Account & Security',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>`,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>`,
    },
    {
      id: 'organizations',
      label: 'Organizations & Profiles',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>`,
    },
    {
      id: 'work',
      label: 'Work Preferences',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>`,
    },
    {
      id: 'privacy',
      label: 'Data & Privacy',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>`,
    },
  ];

  // Weird closing animation logic because nested animations aren't yet in Angular 21 (will come in 22)
  close() {
    this.isLeaving.set(true);
    setTimeout(() => {
      this.closed.emit();
      this.isLeaving.set(false);
    }, 200);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}

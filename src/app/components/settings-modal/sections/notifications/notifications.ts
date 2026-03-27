import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings-notifications',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-base-content">Notifications</h2>
        <p class="text-sm text-base-content/60 mt-0.5">Control when and how ChronoScope notifies you.</p>
      </div>

      <!-- Email notifications -->
      <div class="settings-card">
        <h3 class="settings-card-title">Email Notifications</h3>
        <p class="settings-card-desc">Choose which emails you'd like to receive.</p>
        <ul class="mt-4 divide-y divide-base-300" aria-label="Email notification settings">
          @for (setting of emailSettings; track setting.id) {
            <li class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p class="text-sm font-medium text-base-content">{{ setting.label }}</p>
                <p class="text-xs text-base-content/50 mt-0.5">{{ setting.description }}</p>
              </div>
              <label class="cursor-pointer shrink-0" [attr.aria-label]="'Toggle ' + setting.label">
                <input
                  type="checkbox"
                  [(ngModel)]="setting.enabled"
                  class="toggle toggle-primary toggle-sm"
                  role="switch"
                  [attr.aria-checked]="setting.enabled"
                />
              </label>
            </li>
          }
        </ul>
      </div>

      <!-- Reminders -->
      <div class="settings-card">
        <h3 class="settings-card-title">Reminders</h3>
        <p class="settings-card-desc">Get reminded about upcoming tasks and deadlines.</p>
        <ul class="mt-4 divide-y divide-base-300" aria-label="Reminder settings">
          @for (setting of reminderSettings; track setting.id) {
            <li class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p class="text-sm font-medium text-base-content">{{ setting.label }}</p>
                <p class="text-xs text-base-content/50 mt-0.5">{{ setting.description }}</p>
              </div>
              <label class="cursor-pointer shrink-0" [attr.aria-label]="'Toggle ' + setting.label">
                <input
                  type="checkbox"
                  [(ngModel)]="setting.enabled"
                  class="toggle toggle-primary toggle-sm"
                  role="switch"
                  [attr.aria-checked]="setting.enabled"
                />
              </label>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class NotificationsSection {
  emailSettings: NotificationSetting[] = [
    {
      id: 'email-task-assigned',
      label: 'Task Assigned',
      description: 'Receive an email when a task is assigned to you.',
      enabled: true,
    },
    {
      id: 'email-task-completed',
      label: 'Task Completed',
      description: 'Get notified when a task you created is marked complete.',
      enabled: true,
    },
    {
      id: 'email-weekly-summary',
      label: 'Weekly Summary',
      description: 'A weekly digest of your progress and upcoming tasks.',
      enabled: false,
    },
    {
      id: 'email-org-updates',
      label: 'Organization Updates',
      description: 'News and changes from your organizations.',
      enabled: false,
    },
  ];

  reminderSettings: NotificationSetting[] = [
    {
      id: 'reminder-due-soon',
      label: 'Due Soon',
      description: 'Remind me 1 hour before a task is due.',
      enabled: true,
    },
    {
      id: 'reminder-overdue',
      label: 'Overdue Tasks',
      description: 'Alert me when a task passes its due date.',
      enabled: true,
    },
    {
      id: 'reminder-daily-plan',
      label: 'Daily Planning',
      description: 'Morning reminder to review and plan your day.',
      enabled: false,
    },
  ];
}

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
  templateUrl: './notifications.html',
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

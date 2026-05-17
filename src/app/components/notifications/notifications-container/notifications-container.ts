import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NotificationService } from '@services/notification.service';
import { NotificationToast } from '../notification-toast/notification-toast';

@Component({
  selector: 'app-notifications-container',
  imports: [NotificationToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'region',
    'aria-label': 'Notifications',
    'class': 'fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none',
  },
  template: `
    @for (notification of notificationService.notifications(); track notification.id) {
      <app-notification-toast
        class="pointer-events-auto"
        [notification]="notification"
        (dismissed)="notificationService.dismiss($event)" />
    }
  `,
})
export class NotificationsContainer {
  protected readonly notificationService = inject(NotificationService);
}

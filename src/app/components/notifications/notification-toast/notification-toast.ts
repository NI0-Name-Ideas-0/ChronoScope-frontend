import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FieldError } from '@app/model/chronoscope-error.model';
import { Notification } from '@app/model/notification.model';

@Component({
  selector: 'app-notification-toast',
  imports: [TranslocoPipe],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'status',
    '[attr.aria-live]': 'ariaLive()',
    '[class]': 'hostClasses()',
  },
})
export class NotificationToast {
  notification = input.required<Notification>();
  dismissed = output<string>();

  ariaLive = computed(() => {
    const type = this.notification().type;
    return type === 'error' || type === 'warning' ? 'assertive' : 'polite';
  });

  hostClasses = computed(() => {
    const base = 'toast-item';
    const typeClass = `toast-${this.notification().type}`;
    return `${base} ${typeClass}`;
  });

  fieldErrors = computed<FieldError[]>(() => this.notification().fieldErrors ?? []);

  iconPath = computed(() => {
    switch (this.notification().type) {
      case 'success':
        return 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
      case 'error':
        return 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z';
      case 'warning':
        return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z';
      case 'info':
        return 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z';
    }
  });

  onDismiss(): void {
    this.dismissed.emit(this.notification().id);
  }
}

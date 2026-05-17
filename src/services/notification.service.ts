import { Injectable, signal } from '@angular/core';
import {
  Notification,
  NotificationType,
  getDefaultDuration,
  MAX_VISIBLE_TOASTS,
} from '@app/model/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  private readonly dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  notify(opts: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const notification: Notification = {
      ...opts,
      id,
      dismissible: opts.dismissible ?? true,
    };

    this._notifications.update((list) => [...list, notification]);
    this.enforceMaxVisible();

    if (!opts.persistent) {
      const duration = opts.durationMs ?? getDefaultDuration(opts.type);
      this.scheduleDismiss(id, duration);
    }

    return id;
  }

  success(message: string, opts?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>): string {
    return this.notify({ type: 'success', message, ...opts });
  }

  error(message: string, opts?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>): string {
    return this.notify({ type: 'error', message, ...opts });
  }

  info(message: string, opts?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>): string {
    return this.notify({ type: 'info', message, ...opts });
  }

  warning(message: string, opts?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>): string {
    return this.notify({ type: 'warning', message, ...opts });
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }

  clear(): void {
    this.dismissTimers.forEach((_, id) => this.clearTimer(id));
    this._notifications.set([]);
  }

  private scheduleDismiss(id: string, durationMs: number): void {
    const timer = setTimeout(() => {
      this.dismissTimers.delete(id);
      this._notifications.update((list) => list.filter((n) => n.id !== id));
    }, durationMs);
    this.dismissTimers.set(id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
  }

  private enforceMaxVisible(): void {
    const current = this._notifications();
    if (current.length <= MAX_VISIBLE_TOASTS) return;

    const oldest = current.find((n) => !n.persistent);
    if (oldest) {
      this.dismiss(oldest.id);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
}

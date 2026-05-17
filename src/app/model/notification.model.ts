export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  durationMs?: number;
  persistent?: boolean;
  dismissible?: boolean;
  fieldErrors?: Array<{ field: string; message: string }>;
}

const DEFAULT_DURATION_MS = 5000;
const ERROR_DURATION_MS = 8000;

export const MAX_VISIBLE_TOASTS = 5;

export function getDefaultDuration(type: NotificationType): number {
  return type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS;
}

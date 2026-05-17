---
phase: 1
plan_id: 01-notification-system
wave: 1
depends_on: []
files_modified:
  - src/app/model/notification.model.ts
  - src/services/notification.service.ts
  - src/services/notification.service.spec.ts
  - src/app/components/notifications/notification-toast/notification-toast.ts
  - src/app/components/notifications/notification-toast/notification-toast.html
  - src/app/components/notifications/notification-toast/notification-toast.css
  - src/app/components/notifications/notifications-container/notifications-container.ts
  - src/app/components/notifications/notifications-container/notifications-container.html
  - src/app/components/notifications/notifications-container/notifications-container.css
  - src/app/components/notifications/notifications-container/notifications-container.spec.ts
  - src/app/app.ts
  - src/app/app.html
autonomous: true
requirements: [NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05]
---

# Plan: Build Notification System

## Objective

Create a signals-based NotificationService and a top-right stacked toast container component that supports success, error, info, and warning types with auto-dismiss, manual dismiss, and full accessibility (aria-live, keyboard navigation, color contrast).

## must_haves

- NotificationService with signals API: notify(), success(), error(), info(), warning(), dismiss(), clear()
- NotificationsContainerComponent rendering stacked toasts in fixed top-right position
- Four distinct toast types with visual differentiation: success, error, info, warning
- Auto-dismiss with configurable duration per notification
- Manual dismiss via close button on each toast
- aria-live regions for screen reader announcements
- Keyboard accessibility: toasts focusable, dismiss button reachable via Tab
- Integration into root AppComponent so toasts are globally visible

## Tasks

### Task 1: Create notification model

<read_first>
- src/app/model/task.ts (existing model pattern reference)
</read_first>

<action>
Create `src/app/model/notification.model.ts` with:
- `NotificationType` union type: `'success' | 'error' | 'info' | 'warning'`
- `Notification` interface: `id: string`, `type: NotificationType`, `message: string`, `title?: string`, `durationMs?: number`, `persistent?: boolean`, `dismissible?: boolean`
- `DEFAULT_DURATION_MS` constant: `5000` for success/info/warning, `8000` for error
- `MAX_VISIBLE_TOASTS` constant: `5`
- Helper `getDefaultDuration(type: NotificationType): number`
</action>

<acceptance_criteria>
- src/app/model/notification.model.ts exports NotificationType, Notification, DEFAULT_DURATION_MS, MAX_VISIBLE_TOASTS, getDefaultDuration
- getDefaultDuration('error') returns 8000, getDefaultDuration('success') returns 5000
- Notification interface has all required fields with correct optionality
</acceptance_criteria>

### Task 2: Create NotificationService

<read_first>
- src/services/theme.service.ts (existing service pattern: inject(), signal(), providedIn: 'root')
- src/app/model/notification.model.ts (model created in Task 1)
</read_first>

<action>
Create `src/services/notification.service.ts`:
- `@Injectable({ providedIn: 'root' })` class `NotificationService`
- Private `_notifications = signal<Notification[]>([])`
- Public `notifications = this._notifications.asReadonly()`
- Public `notify(opts: Omit<Notification, 'id'>): string` — generates unique ID, adds to list, schedules auto-dismiss if not persistent, returns the ID
- Public `success(message: string, opts?: Partial<Notification>): string`
- Public `error(message: string, opts?: Partial<Notification>): string`
- Public `info(message: string, opts?: Partial<Notification>): string`
- Public `warning(message: string, opts?: Partial<Notification>): string`
- Public `dismiss(id: string): void` — removes notification by ID
- Public `clear(): void` — removes all notifications
- Private `scheduleDismiss(id: string, durationMs: number)` — uses setTimeout, clears on manual dismiss
- Enforce `MAX_VISIBLE_TOASTS` — when exceeded, dismiss the oldest non-persistent notification
- Use `update()` on signals (never `mutate`)
</action>

<acceptance_criteria>
- src/services/notification.service.ts exists with @Injectable({ providedIn: 'root' })
- notify() adds a notification and returns its ID
- success(), error(), info(), warning() delegate to notify() with the correct type
- dismiss(id) removes the notification from the signal
- clear() empties all notifications
- Auto-dismiss fires after durationMs (default from getDefaultDuration)
- MAX_VISIBLE_TOASTS is enforced — oldest non-persistent notification removed when limit exceeded
</acceptance_criteria>

### Task 3: Create NotificationService unit tests

<read_first>
- src/services/notification.service.ts (service under test)
- src/services/work-slot-preference.service.spec.ts (existing test pattern: TestBed, vi.fn())
</read_first>

<action>
Create `src/services/notification.service.spec.ts`:
- Test notify() adds notification to signal
- Test success/error/info/warning helper methods set correct type
- Test dismiss(id) removes specific notification
- Test clear() removes all notifications
- Test auto-dismiss fires after durationMs using vi.useFakeTimers()
- Test MAX_VISIBLE_TOASTS enforcement removes oldest non-persistent
- Test persistent notifications are not auto-dismissed
</action>

<acceptance_criteria>
- src/services/notification.service.spec.ts exists
- `pnpm test --watch=false` passes with all notification service tests green
- Tests cover: add, dismiss, clear, auto-dismiss timing, max-visible limit, persistent flag
</acceptance_criteria>

### Task 4: Create NotificationToast component

<read_first>
- src/app/components/topbar/topbar.ts (existing component pattern: standalone, OnPush, input/output)
- src/app/model/notification.model.ts (Notification interface)
- src/styles.css (global styles, Tailwind/DaisyUI theme tokens)
</read_first>

<action>
Create directory `src/app/components/notifications/notification-toast/` with:

`notification-toast.ts`:
- Standalone component, selector `app-notification-toast`, ChangeDetectionStrategy.OnPush
- `notification = input.required<Notification>()` — the notification data
- `dismissed = output<string>()` — emits notification ID when user clicks dismiss
- Computed `iconClass` and `colorClass` derived from notification().type
- `host: { role: 'status', '[attr.aria-live]': 'ariaLive()', class: '...' }`
- Computed `ariaLive()` returning 'assertive' for error/warning, 'polite' for success/info

`notification-toast.html`:
- Outer container with type-specific border/background color using Tailwind classes
- Icon area (SVG or emoji) per type
- Content area: title (if present) in font-semibold, message in font-normal
- Dismiss button with `aria-label="Dismiss notification"`, (click) emitting dismissed output
- Progress bar showing remaining auto-dismiss time (optional visual, driven by CSS animation)

`notification-toast.css`:
- Entry/exit animation: slide-in from right, fade-out on dismiss
- Type-specific color variants using Tailwind utilities and CSS custom properties
- Ensure min color contrast ratio 4.5:1 for both light and dark themes
</action>

<acceptance_criteria>
- src/app/components/notifications/notification-toast/notification-toast.ts exists as standalone component
- Component uses input() and output() functions, not decorators
- Component sets host role="status" and aria-live attribute
- aria-live is 'assertive' for error/warning types, 'polite' for success/info
- Dismiss button has aria-label="Dismiss notification"
- Template uses @if for conditional title rendering
- Styling supports both chrono-light and chrono-dark themes
</acceptance_criteria>

### Task 5: Create NotificationsContainer component

<read_first>
- src/app/components/notifications/notification-toast/notification-toast.ts (toast component from Task 4)
- src/services/notification.service.ts (service from Task 2)
</read_first>

<action>
Create directory `src/app/components/notifications/notifications-container/` with:

`notifications-container.ts`:
- Standalone component, selector `app-notifications-container`, ChangeDetectionStrategy.OnPush
- `private notificationService = inject(NotificationService)`
- `notifications = this.notificationService.notifications` (readonly signal)
- `onDismiss(id: string)` method calling `this.notificationService.dismiss(id)`

`notifications-container.html`:
- Fixed container: `class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"`
- `@for (notification of notifications(); track notification.id)` iterating notifications
- Each iteration renders `<app-notification-toast [notification]="notification" (dismissed)="onDismiss($event)" class="pointer-events-auto" />`
- Container itself has `aria-label="Notifications"` and `role="region"`

`notifications-container.css`:
- Minimal — layout handled by Tailwind utilities in template
- Optional animation keyframes for stacking transitions

`notifications-container.spec.ts`:
- Test that component renders when notifications exist
- Test that dismiss button removes notification
- Test that component has role="region" and aria-label="Notifications"
</action>

<acceptance_criteria>
- src/app/components/notifications/notifications-container/notifications-container.ts exists as standalone component
- Container uses fixed positioning with top-right placement via Tailwind classes
- Container iterates notifications using @for with track by notification.id
- Each toast gets pointer-events-auto to be interactive above the pointer-events-none container
- Container has role="region" and aria-label="Notifications"
- Dismiss output from toast calls notificationService.dismiss()
</acceptance_criteria>

### Task 6: Integrate into AppComponent

<read_first>
- src/app/app.ts (root component to modify)
- src/app/app.html (root template to modify)
- src/app/components/notifications/notifications-container/notifications-container.ts (container component)
</read_first>

<action>
Update `src/app/app.ts`:
- Add `NotificationsContainer` to the `imports` array

Update `src/app/app.html`:
- Add `<app-notifications-container />` after `<router-outlet />`
</action>

<acceptance_criteria>
- src/app/app.ts imports NotificationsContainer in the imports array
- src/app/app.html contains `<app-notifications-container />` alongside `<router-outlet />`
- Application builds without errors: `pnpm build` exits 0
- All existing tests pass: `pnpm test --watch=false` exits 0
</acceptance_criteria>

## Verification

After all tasks complete:
1. `pnpm build` succeeds with no errors
2. `pnpm test --watch=false` succeeds — all new and existing tests pass
3. NotificationService can be injected and creates/dismisses/clears notifications via signals
4. NotificationsContainer renders in top-right corner of the app
5. Four toast types display with distinct visual styling
6. Toasts auto-dismiss and can be manually dismissed
7. Toast container uses aria-live regions and role="region"

# Roadmap: ChronoScope v0.1 — Toast Notifications

**Milestone:** v0.1
**Phases:** 4
**Requirements:** 18

---

## Phase 1: Build notification system

**Goal:** Create the NotificationService, toast container component, and supporting types so the app has a working toast notification infrastructure.

**Depends on:** Nothing

**Requirements:** NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05

**Success criteria:**
1. NotificationService can create, dismiss, and auto-expire toast notifications using signals
2. NotificationsContainerComponent renders stacked toasts in the top-right corner
3. Toasts display with distinct visual styles for success, error, info, and warning types
4. Toasts auto-dismiss after a configurable duration and can be manually dismissed
5. Toast container uses aria-live regions and toasts are keyboard-accessible

**Plans:**
- (Not planned yet)

---

## Phase 2: Error handling refactor and integrations

**Goal:** Add an HttpErrorInterceptor that routes API errors to toasts by default, and integrate success/error notifications into existing service operations.

**Depends on:** Phase 1

**Requirements:** ERR-01, ERR-02, INTEG-01, INTEG-02, INTEG-03, INTEG-04, INTEG-05

**Success criteria:**
1. HTTP errors automatically produce error toasts unless the caller opts out
2. WorkSlotPreferenceService.savePreferences shows success/error toasts
3. TaskService planning failures show error toasts
4. TaskService task creation, update, and deletion show success toasts
5. Existing inline error handling (if any) continues to work alongside the interceptor

**Plans:**
- (Not planned yet)

---

## Phase 3: Display API error content and improve notification messages

**Goal:** Parse and display meaningful error messages from API responses (ProblemDetail, validation errors), and improve all existing notification messages to be user-friendly and context-specific.

**Depends on:** Phase 2

**Requirements:** MSG-01, MSG-02

**Success criteria:**
1. API error toasts display the actual error detail from ProblemDetail responses instead of generic messages
2. All notification messages across the app are clear, user-friendly, and context-specific

**Plans:**
- (Not planned yet)

## Phase 4: Properly display information from API exception responses in toast

**Goal:** Parse and display the full RFC 9457 ProblemDetail structure from backend error responses — including errorCode-based user-friendly messages, validation fieldErrors display, and exposing error metadata for programmatic handling.

**Depends on:** Phase 3

**Requirements:** ERRX-01, ERRX-02, ERRX-03, ERRX-04

**Success criteria:**
1. Error toasts display errorCode-mapped user-friendly messages synced with backend
2. Validation error toasts show per-field errors (field name + message) inline
3. errorCode and type URI are exposed to callers for programmatic error handling
4. Existing error handling behavior is preserved for non-ProblemDetail responses

**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — Error model, errorCode mapping, and interceptor enhancement
- [ ] 04-02-PLAN.md — Toast field errors display and test coverage

---

*Roadmap created: 2026-05-17*

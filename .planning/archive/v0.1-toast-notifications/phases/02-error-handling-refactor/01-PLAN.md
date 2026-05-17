# Phase 2 Plan: Error Handling Refactor & Integrations

**Phase:** 2 of 2
**Goal:** Add an HttpErrorInterceptor that routes API errors to toasts by default, and integrate success/error notifications into existing service operations.
**Requirements:** ERR-01, ERR-02, INTEG-01, INTEG-02, INTEG-03, INTEG-04, INTEG-05

---

## Wave 1 — All tasks (no internal dependencies)

### Task 1 · Create HTTP error interceptor

**File:** `src/app/interceptors/error.interceptor.ts`
**Reqs:** ERR-01, ERR-02

Create an `HttpInterceptorFn` that:
1. Catches HTTP errors in the `catchError` operator
2. Checks the request's `HttpContext` for a `SKIP_ERROR_TOAST` token — if set, skip the toast
3. Parses the error response body for a `ProblemDetail` structure (`detail` or `title` field)
4. Falls back to `error.statusText` or generic "An error occurred" message
5. Calls `NotificationService.error()` with the parsed message
6. Re-throws the error so callers can still handle it

Also export:
- `SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false)` for the opt-out mechanism

**Acceptance:**
- HTTP errors automatically produce error toasts (ERR-01)
- Callers can pass `new HttpContext().set(SKIP_ERROR_TOAST, true)` to suppress (ERR-02)
- Error is re-thrown so existing catch blocks still work

---

### Task 2 · Register interceptor in app config

**File:** `src/app/app.config.ts`

Add `errorInterceptor` to the `withInterceptors([...])` array, **after** `oauthInterceptor` so auth headers are attached before error handling runs.

---

### Task 3 · Create interceptor unit tests

**File:** `src/app/interceptors/error.interceptor.spec.ts`

Test cases:
- HTTP error shows an error toast with the response message
- `SKIP_ERROR_TOAST` context token suppresses the toast
- ProblemDetail `detail` field is used as toast message
- ProblemDetail `title` field is used as fallback when `detail` is missing
- Generic fallback message when response body is not ProblemDetail
- Error is re-thrown to the caller

---

### Task 4 · Integrate notifications into WorkSlotPreferenceService

**File:** `src/services/work-slot-preference.service.ts`
**Req:** INTEG-01

Changes to `savePreferences()`:
- Wrap existing logic in try/catch
- On success: `notificationService.success('Work schedule saved')`
- On error: re-throw (interceptor handles the error toast)

---

### Task 5 · Integrate notifications into TaskService

**File:** `src/services/task.service.ts`
**Reqs:** INTEG-02, INTEG-03, INTEG-04, INTEG-05

Changes:
- `createTask()`: add `notificationService.success('Task created')` after successful creation
- `updateTask()`: add `notificationService.success('Task updated')` after successful update
- `deleteTask()`: add `notificationService.success('Task deleted')` after successful deletion
- `loadTasks()`: remove `console.error` — interceptor handles error toast
- `planAndReload()`: remove `console.error` — interceptor handles error toast
- `planOrganizationsAndReload()`: remove `console.error` — interceptor handles error toast

Planning errors are handled silently by the interceptor (error toast shown automatically). Planning success is silent (tasks just reload, per INTEG-02).

---

## Verification

After all tasks:
1. `pnpm build` — must succeed
2. `pnpm test -- --watch=false` — all tests must pass
3. Commit with descriptive message

---

*Plan created: 2026-05-17*

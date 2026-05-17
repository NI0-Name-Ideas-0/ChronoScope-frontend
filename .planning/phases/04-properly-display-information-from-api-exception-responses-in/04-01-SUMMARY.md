---
phase: 04-properly-display-information-from-api-exception-responses-in
plan: 01
subsystem: error-handling
tags: [error-model, interceptor, problem-detail, notifications]
dependency_graph:
  requires: []
  provides: [ChronoscopeError, parseErrorBody, errorCode-mapping, fieldErrors-in-notification]
  affects: [error.interceptor, notification.model]
tech_stack:
  added: []
  patterns: [typed-error-class, errorCode-title-mapping, centralized-error-parsing]
key_files:
  created:
    - src/app/model/chronoscope-error.model.ts
  modified:
    - src/app/model/notification.model.ts
    - src/app/interceptors/error.interceptor.ts
decisions:
  - "Moved statusTitle, fallbackMessage, isProblemDetail helpers into chronoscope-error.model.ts to avoid circular deps and keep interceptor lean"
  - "Validate errorCode against known ApiErrorCode values before map lookup — unknown codes fall back gracefully (T-04-01 mitigation)"
  - "Blob error bodies re-throw raw HttpErrorResponse since async Blob parsing can't block the observable chain"
metrics:
  duration: "2m 21s"
  completed: "2026-05-17"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 04 Plan 01: ChronoscopeError Model & Enhanced Interceptor Summary

**One-liner:** ChronoscopeError class with errorCode-to-title mapping and enhanced interceptor parsing ProblemDetail properties for structured error handling

## What Was Built

### Task 1: ChronoscopeError model with errorCode mapping (358c337)
- Created `ChronoscopeError` class extending `Error` with typed properties: `errorCode`, `typeUri`, `fieldErrors`, `detail`, `title`, `status`, `httpError`
- Defined `ApiErrorCode` string literal union (8 backend-synced codes) and `ERROR_CODE_TITLES` mapping
- Added `FieldError` interface and `parseErrorBody` helper function
- Title resolution chain: errorCode map → ProblemDetail title → status-based fallback
- Validates errorCode against known values before map lookup (T-04-01 threat mitigation)
- Extended `Notification` interface with optional `fieldErrors` array (inline type to avoid circular deps)

### Task 2: Enhanced error interceptor (f04d7ab)
- Replaced `extractMessage` with `parseErrorBody` from ChronoscopeError model
- Non-Blob bodies: re-throws `ChronoscopeError` instead of raw `HttpErrorResponse`
- Blob bodies: parses async for toast, re-throws raw `HttpErrorResponse` (can't block observable)
- Passes `fieldErrors` to `notificationService.error()` for downstream toast rendering
- Removed unused helpers (extractMessage, isProblemDetail, statusTitle, fallbackMessage) from interceptor
- All 10 existing tests pass unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **Helper function location:** Moved `statusTitle`, `fallbackMessage`, `isProblemDetail` into the model file rather than keeping them in the interceptor. This centralizes parsing logic in one place and keeps the interceptor focused on HTTP concerns.
2. **errorCode validation:** Used a type guard (`isValidErrorCode`) that checks against the `ERROR_CODE_TITLES` record keys, so unknown/tampered errorCodes safely fall through to ProblemDetail title or status-based fallback.
3. **Blob re-throw strategy:** Blob bodies re-throw raw `HttpErrorResponse` since `Blob.text()` is async and can't resolve within the synchronous `throwError` path.

## Verification Results

- `npx tsc --noEmit --project tsconfig.app.json` → PASS (0 errors)
- `npx ng test --include=src/app/interceptors/error.interceptor.spec.ts --watch=false` → 10/10 tests pass

## Self-Check: PASSED

- [x] `src/app/model/chronoscope-error.model.ts` exists
- [x] `src/app/model/notification.model.ts` modified with fieldErrors
- [x] `src/app/interceptors/error.interceptor.ts` modified with ChronoscopeError
- [x] Commit 358c337 exists
- [x] Commit f04d7ab exists

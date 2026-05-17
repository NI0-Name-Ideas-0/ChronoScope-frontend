# Phase 3 Plan: API Error Message Content & Proper Messages

**Phase:** 3 of 3
**Goal:** Parse and display meaningful error messages from API responses, including Blob-encoded ProblemDetail bodies, and ensure all notification messages are user-friendly.
**Requirements:** MSG-01, MSG-02

---

## Problem

The API is generated with `responseType: 'blob'`, so `HttpErrorResponse.error` is a Blob, not parsed JSON. The current interceptor's `isProblemDetail()` check fails on Blob bodies — users always see generic fallback messages instead of actual API error details.

## Wave 1

### Task 1 · Fix error interceptor to parse Blob error bodies

**File:** `src/app/interceptors/error.interceptor.ts`
**Req:** MSG-01

Changes:
1. Make `parseErrorMessage()` async — check if `error.error` is a Blob
2. If Blob: read with `blob.text()`, parse JSON, extract ProblemDetail fields
3. If already an object: use existing logic
4. Show toast asynchronously (fire-and-forget), re-throw error synchronously
5. Add error title from ProblemDetail `title` or HTTP status category

### Task 2 · Update interceptor tests for Blob parsing

**File:** `src/app/interceptors/error.interceptor.spec.ts`
**Req:** MSG-01

Add test cases:
- Blob error body with ProblemDetail content is correctly parsed
- Blob error body with `detail` + `title` shows detail as message and title as toast title
- Non-JSON Blob body falls back to generic message
- Existing JSON body tests still pass

### Task 3 · Review and standardize all notification messages

**Files:** `src/services/task.service.ts`, `src/services/work-slot-preference.service.ts`
**Req:** MSG-02

Audit and improve:
- Ensure all success messages are consistent in tone and style
- Current messages ("Task created", "Task updated", "Task deleted", "Work schedule saved") are already clean
- Add appropriate titles where beneficial

---

## Verification

1. `pnpm build` — must succeed
2. `pnpm test -- --watch=false` — all tests must pass
3. Commit with descriptive message

---

*Plan created: 2026-05-17*

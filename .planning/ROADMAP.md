# Roadmap: ChronoScope v0.3 — Internationalize toast messages and errors from backend

**Milestone:** v0.3
**Phases:** 2
**Requirements:** 8

---

## Phase 1: Toast Message Localization

**Goal:** All user-facing toast messages display in the user's active language

**Depends on:** Nothing

**Requirements:** TOAST-01, TOAST-02, TOAST-03, TOAST-04

**Success criteria:**
1. User sees task created/updated/deleted success toasts in German when DE is active
2. User sees "Work schedule saved" toast in German when DE is active
3. User sees a success toast after planning completes successfully (in active language)
4. User sees the connection error toast ("Unable to reach the server") in German when DE is active

**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md — Localize all toast messages via TranslocoService + add planning success toast

**UI hint**: no

---

## Phase 2: Backend Error Localization

**Goal:** Backend error responses display with localized titles and headers while preserving the raw detail message

**Depends on:** Phase 1

**Requirements:** BE-01, ERR-01, ERR-02, ERR-03

**Success criteria:**
1. All backend ProblemDetail responses include a stable `errorCode` field (no missing codes)
2. Error toast titles (e.g., "Planning Failed", "Not Found") display in the user's active language based on the errorCode
3. Error toasts show a localized header (e.g., "Ein Fehler ist aufgetreten") above the raw backend detail message
4. Field validation errors display localized field labels (e.g., "Titel" instead of "title" in DE)

**Plans:** 1 plan

Plans:
- [ ] 02-01-PLAN.md — Localize error toast titles via ERROR_TITLE_* and ERROR_FALLBACK_* keys in interceptor

**UI hint**: no

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Toast Message Localization | 0/1 | Planning complete | - |
| 2. Backend Error Localization | 0/0 | Not started | - |

---

*Roadmap created: 2026-05-17*

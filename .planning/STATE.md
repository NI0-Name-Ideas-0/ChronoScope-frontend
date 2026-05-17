---
milestone: "v0.1"
milestone_name: "Toast Notifications"
status: planning
progress:
  phases_total: 2
  phases_done: 0
  current_phase: 1
  current_plan: null
---

# ChronoScope — State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Users can plan and schedule their tasks across organizations with automatic time-slot-aware planning
**Current focus:** Defining requirements for v0.1

## Current Position

Phase: 4 — Properly display information from API exception responses in toast
Plan: Completed (all plans in phase 4 done)
Status: Phase 4 complete — 04-01 and 04-02 both executed
Last activity: 2026-05-17 — Phase 4 plan 02 executed (2 tasks, 4 files)

## Accumulated Context

### Roadmap Evolution

- Milestone v0.1 started: Toast Notifications
- Phase 4 added: Properly display information from api exception responses in toast
- Phase 4 plan 01 completed: ChronoscopeError model + interceptor enhancement
- Phase 4 plan 02 completed: Toast field errors display + interceptor test coverage

### Decisions

- Moved statusTitle/fallbackMessage/isProblemDetail helpers into chronoscope-error.model.ts for centralized parsing
- Validate errorCode against known ApiErrorCode values before map lookup (unknown codes fall back gracefully)
- Blob error bodies re-throw raw HttpErrorResponse since async Blob parsing can't block observable chain
- Used computed signal for fieldErrors to keep template reactive and consistent with Angular signal patterns
- Used @if/@for control flow blocks per Angular 21 best practices
- Field errors list uses role=list for accessibility compliance

### Blockers

(None)

### Todos

(None)

---
gsd_state_version: 1.0
milestone: v0.2
milestone_name: Internationalization (EN and DE only)
status: planning
last_updated: "2026-05-17T16:15:04.780Z"
last_activity: 2026-05-17 — Roadmap created (3 phases, 10 requirements)
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# ChronoScope — State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Users can plan and schedule their tasks across organizations with automatic time-slot-aware planning
**Current focus:** v0.2 — Internationalization (EN and DE only)

## Current Position

Phase: 1 — Transloco infrastructure and runtime switching
Plan: —
Status: Context gathered, ready for planning
Last activity: 2026-05-17 — Phase 1 context gathered (3 decisions captured)

## Accumulated Context

### Roadmap Evolution

- Milestone v0.2 started: Internationalization (EN and DE only)

### Decisions

- Using Transloco for runtime i18n (lazy-loaded, signals-friendly)
- Language preference from backend only (default EN)
- No URL-based locale routing
- Language switcher in Appearance & Language settings section
- Global translation scope (single en.json/de.json, no per-feature scoping)
- SCREAMING_SNAKE_CASE keys (e.g. TASK_CREATE_TITLE)
- Programmatic language switching only in Phase 1 (UI selector in Phase 3)

### Blockers

(None)

### Todos

(None)

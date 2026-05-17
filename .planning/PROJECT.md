# ChronoScope

## What This Is

A browser-based task planning system that supports structured task management, scheduling, and dependency handling. Users organize tasks, assign them to organizations for time-slot-based scheduling, and view planned work via calendar and list views.

## Core Value

Users can plan and schedule their tasks across organizations with automatic time-slot-aware planning — the algorithm handles when work gets done so users focus on what to do.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ AUTH-01: User can authenticate via OAuth2/OpenID Connect — v0.0
- ✓ TASK-01: User can create, update, and delete tasks — v0.0
- ✓ TASK-02: User can view tasks in calendar and list views — v0.0
- ✓ TASK-03: User can trigger planning to schedule tasks automatically — v0.0
- ✓ WORK-01: User can configure work slot preferences per organization — v0.0
- ✓ VIEW-01: User can switch between calendar and list views — v0.0
- ✓ THEME-01: User can switch between light, dark, and system themes — v0.0

### Active

<!-- Current scope. Building toward these. -->

- [ ] I18N-01: All user-visible UI strings are externalized as translation keys
- [ ] I18N-02: English (en) and German (de) translation files exist for all keys
- [ ] I18N-03: User can switch language in the Appearance & Language settings section
- [ ] I18N-04: Language preference is persisted to the backend via settings endpoint
- [ ] I18N-05: App loads language from backend preference on startup (defaults to EN)
- [ ] I18N-06: Language changes apply at runtime without page reload

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Push notifications — No server-push or browser notification API; toasts are in-app only
- Persistent notification center / history — Toasts are transient; no inbox or log view
- User-to-user messaging — Not part of ChronoScope's scope
- Date/time/number formatting per locale — Only text localization in this milestone
- URL-based locale routing — Language is user preference, not URL-routed
- RTL support — Not needed for EN/DE languages
- Browser language detection — Using backend preference only for simplicity

## Context

- Angular 21 standalone component architecture with OnPush + signals
- Tailwind CSS + DaisyUI for styling
- Generated OpenAPI client under src/api/ (ng-openapi-gen)
- Existing interceptor: oauth.interceptor.ts (token attachment only)
- Services use providedIn: 'root' and inject() pattern
- Error handling is currently console.error / console.warn with no user-visible feedback
- Work slot saves, task CRUD, and planning calls silently succeed or fail

## Constraints

- **Tech stack**: Angular 21, Tailwind CSS, TypeScript — established and locked
- **Accessibility**: Must pass AXE checks and meet WCAG AA minimums
- **API client**: src/api/ is generated — do not edit; wrap in services

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Signals-based NotificationService over NgRx | Project already uses signals for state; consistency and simplicity | Validated v0.1 |
| Top-right stacked toasts | Standard SaaS pattern; non-intrusive, scannable | Validated v0.1 |
| HttpErrorInterceptor with opt-out | Default-toast for API errors reduces boilerplate; opt-out for inline error UIs | Validated v0.1 |
| Transloco for i18n over Angular built-in | Runtime language switching needed; Transloco supports signals and lazy-loading | — Pending |
| Language from backend preference only | Simpler than browser detection; backend already has language field | — Pending |
| No URL-based locale routing | App is SPA with auth; locale is user preference, not URL-routed | — Pending |

## Current Milestone: v0.2 Internationalization (EN and DE only)

**Goal:** Add full UI text localization with English and German translations, runtime language switching via Transloco, and persist user language preference through the existing backend settings endpoint.

**Target features:**
- Transloco integration for runtime i18n (lazy-loaded translation files)
- Extract all user-visible strings to translation keys (EN + DE)
- Language switcher in the Appearance & Language settings section (below theme card)
- Load language from backend preference on app start (default to EN if unset)
- Save language preference to backend via settings endpoint
- Runtime language switching without page reload

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-17 after milestone v0.2 initialization*

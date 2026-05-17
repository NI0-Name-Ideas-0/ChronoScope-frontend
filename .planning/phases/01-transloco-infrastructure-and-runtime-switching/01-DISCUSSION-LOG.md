# Phase 1: Transloco infrastructure and runtime switching - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 01-transloco-infrastructure-and-runtime-switching
**Areas discussed:** Translation scope strategy, Key naming convention, Runtime switching mechanism

---

## Translation Scope Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single global scope | One en.json / de.json with all keys. Simpler, loads everything upfront. | ✓ |
| Per-feature scoped files | Separate files per feature area, lazy-loaded per scope. Scales better. | |
| Hybrid | Global for shared strings + scoped for large feature areas. | |

**User's choice:** Single global scope (option a)
**Notes:** None — straightforward selection.

---

## Key Naming Convention

| Option | Description | Selected |
|--------|-------------|----------|
| Flat dot-notation | e.g. `nav.dashboard`, `task.create.title` | |
| Nested JSON | e.g. `{ "nav": { "dashboard": "..." } }` | |
| SCREAMING_SNAKE_CASE | e.g. `TASK_CREATE_TITLE`, `NAV_DASHBOARD` | ✓ |

**User's choice:** SCREAMING_SNAKE_CASE (deviation from offered options — user specified custom format)
**Notes:** User explicitly requested caps with underscores: `TASK_CREATE_TITLE` format. Flat structure, underscores as hierarchy separators.

---

## Runtime Switching Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Programmatic only | TranslocoService.setActiveLang() callable, no UI. Tests/devs switch via console. | ✓ |
| Temporary dev toggle | Small temporary button in topbar, replaced by proper selector in Phase 3. | |

**User's choice:** Programmatic only (option a)
**Notes:** Language selector UI deferred to Phase 3. Phase 1 just proves runtime switching works without a UI.

---

## Agent's Discretion

None — user made all decisions.

## Deferred Ideas

None — discussion stayed within phase scope.

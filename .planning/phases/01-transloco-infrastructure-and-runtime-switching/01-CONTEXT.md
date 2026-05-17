# Phase 1: Transloco infrastructure and runtime switching - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the i18n foundation for ChronoScope: integrate Transloco, extract all hardcoded user-visible strings to translation keys, provide lazy-loaded EN and DE locale files, and enable runtime language switching without page reload.

</domain>

<decisions>
## Implementation Decisions

### Translation Scope Strategy
- **D-01:** Use a single global translation scope — one `en.json` and one `de.json` file per locale. No per-feature or per-component scoped files. All keys live in the global scope.

### Key Naming Convention
- **D-02:** Use SCREAMING_SNAKE_CASE for all translation keys. Format: `AREA_ELEMENT_DETAIL` (e.g. `TASK_CREATE_TITLE`, `NAV_DASHBOARD`, `SETTINGS_APPEARANCE_THEME`). No dots, no nesting — flat key structure with underscores as hierarchy separators.

### Runtime Switching Mechanism
- **D-03:** Phase 1 provides programmatic-only language switching via `TranslocoService.setActiveLang()`. No UI toggle is built in this phase — the language selector UI comes in Phase 3. Switching is available for testing and development via service calls or browser console.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Key decisions: Transloco chosen over Angular built-in i18n; language from backend preference only
- `.planning/REQUIREMENTS.md` — Requirements I18N-01, I18N-02, I18N-03 define this phase's deliverables
- `.planning/ROADMAP.md` — Phase 1 success criteria and phase boundaries

### Codebase Integration
- `src/app/app.config.ts` — Application providers; Transloco provider goes here
- `src/api/models/settings-response.ts` — Backend already has `language` field (de_DE or en_US format)
- `src/app/components/settings-modal/sections/appearance/appearance.ts` — Appearance section pattern (language selector will follow this in Phase 3)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppearanceSection` component: Established pattern for settings cards (theme selector) — Phase 3 language selector will follow this same structure
- `ThemeService`: Pattern for a preference service with signal-based state — language service can mirror this approach

### Established Patterns
- Standalone components with `ChangeDetectionStrategy.OnPush` throughout
- Services use `inject()` and `providedIn: 'root'`
- Path aliases: `@services/*`, `@app/*`, `@components/*` — new services/configs follow these
- `app.config.ts` is the single provider registration point

### Integration Points
- `app.config.ts` — Transloco provider registration alongside existing providers
- Every component template — hardcoded strings replaced with `transloco` pipe or directive
- `public/` or `src/assets/` — translation JSON files location (build asset path configured in `angular.json`)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Transloco setup and string extraction.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-transloco-infrastructure-and-runtime-switching*
*Context gathered: 2026-05-17*

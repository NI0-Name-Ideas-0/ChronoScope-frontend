# Phase 3: Language preference persistence - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a language selector to the Appearance & Language settings section, persist the user's choice to the backend via the existing settings endpoint, and restore the preference on app startup using a localStorage-first strategy for instant rendering.

</domain>

<decisions>
## Implementation Decisions

### Language Selector UI
- **D-01:** Use a simple dropdown/select element for the language selector — not cards (like theme) or radio buttons. Only two options: English, Deutsch. Placed in the Appearance & Language settings section below the theme card.

### Startup Loading Strategy
- **D-02:** Use localStorage cache of the user's last selected language for instant startup (no flash of wrong language). On app boot: read cached language from localStorage → apply immediately via TranslocoService.setActiveLang() → then fetch backend settings to confirm/update. If backend returns a different language, update localStorage and switch. If no localStorage cache exists, default to English.

### Save Behavior
- **D-03:** Selecting a language in the dropdown immediately: (1) switches the UI via TranslocoService.setActiveLang(), (2) saves to localStorage, (3) fires a backend settings update (non-blocking — optimistic save).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Outputs (prerequisite)
- `.planning/phases/01-transloco-infrastructure-and-runtime-switching/01-CONTEXT.md` — D-03 (programmatic switching via TranslocoService.setActiveLang())

### Backend API
- `src/api/models/settings-response.ts` — `language` field: `de_DE` or `en_US` format
- `src/api/models/settings-update-request.ts` — `language` field for saving preference

### Existing Patterns
- `src/app/components/settings-modal/sections/appearance/appearance.ts` — Pattern for settings section component (theme card)
- `src/services/theme.service.ts` — Pattern for a preference service with signal-based state and localStorage persistence

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements LANG-01, LANG-02, LANG-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ThemeService` — Established pattern for preference with signal + localStorage + backend sync. Language service should mirror this approach.
- `AppearanceSection` component — The language selector goes in this section (or a sibling section below it)
- Generated API functions for settings GET/PUT — already wired, just call them

### Established Patterns
- Services use `inject()` and `providedIn: 'root'`
- Signal-based state with `signal()` and `computed()`
- Settings are loaded early in the app lifecycle (theme service does this)
- Optimistic UI updates with background backend save

### Integration Points
- `src/app/app.config.ts` — Language service initialization (APP_INITIALIZER or equivalent)
- `src/services/` — New language.service.ts following ThemeService pattern
- `src/app/components/settings-modal/sections/appearance/` — Add language dropdown to this section (or create language subsection)
- localStorage key for caching (e.g. `chronoscope-language`)

</code_context>

<specifics>
## Specific Ideas

- localStorage key: `chronoscope-language` (matches existing `chronoscope-completion` pattern)
- Backend format: `en_US` / `de_DE` — map to Transloco's `en` / `de` internally
- Dropdown labels: "English" and "Deutsch" (each language named in itself)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 3-language-preference-persistence*
*Context gathered: 2026-05-17*

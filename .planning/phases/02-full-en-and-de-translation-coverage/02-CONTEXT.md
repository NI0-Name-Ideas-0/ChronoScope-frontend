# Phase 2: Full EN and DE translation coverage - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure every piece of user-visible text in the application has correct, complete English and German translations — navigation, tasks, notifications, forms, settings, and validation messages. All strings must read naturally in both languages with no untranslated keys or placeholder text remaining.

</domain>

<decisions>
## Implementation Decisions

### Translation Tone and Formality
- **D-01:** Use informal "du" addressing for all German translations. Modern SaaS tone — friendly, direct, consistent with apps like Notion and Linear. No formal "Sie" anywhere.

### Agent's Discretion
- Translation wording/phrasing for individual strings — as long as "du" tone is maintained and meaning is accurate
- Key grouping within the flat en.json/de.json structure (follows SCREAMING_SNAKE_CASE convention from Phase 1)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Outputs (prerequisite)
- `.planning/phases/01-transloco-infrastructure-and-runtime-switching/01-CONTEXT.md` — D-01 (global scope), D-02 (SCREAMING_SNAKE_CASE keys), D-03 (programmatic switching)
- `public/i18n/en.json` — Existing English translation file (created in Phase 1)
- `public/i18n/de.json` — Existing German translation file (created in Phase 1)

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements TRANS-01 through TRANS-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/i18n/en.json` — Phase 1 creates all keys with English values; Phase 2 verifies completeness and correctness
- `public/i18n/de.json` — Phase 1 creates all keys with initial German values; Phase 2 reviews and corrects translations

### Established Patterns
- SCREAMING_SNAKE_CASE keys: AREA_ELEMENT_DETAIL format
- Single global scope — all keys in one file per locale
- Transloco pipe in templates for rendering

### Integration Points
- Every component template — verify transloco pipe renders both EN and DE correctly
- Toast/notification service messages — verify dynamic messages translate properly

</code_context>

<specifics>
## Specific Ideas

- German tone: informal "du" throughout — "Dein Profil", "Erstelle eine Aufgabe", not "Ihr Profil", "Erstellen Sie eine Aufgabe"
- Natural-sounding German, not literal word-for-word translations from English

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-full-en-and-de-translation-coverage*
*Context gathered: 2026-05-17*

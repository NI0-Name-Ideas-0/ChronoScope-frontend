# Requirements: ChronoScope

**Defined:** 2026-05-17
**Core Value:** Users can plan and schedule their tasks across organizations with automatic time-slot-aware planning

## v0.2 Requirements

Requirements for milestone v0.2: Internationalization (EN and DE only).

### i18n Infrastructure

- [ ] **I18N-01**: User sees all UI text rendered from Transloco translation keys (no hardcoded strings)
- [ ] **I18N-02**: Translation files are lazy-loaded per locale (EN and DE)
- [ ] **I18N-03**: Language changes apply at runtime without page reload

### Translation Coverage

- [ ] **TRANS-01**: All navigation, settings, and layout text has EN and DE translations
- [ ] **TRANS-02**: All task-related UI text (create, edit, list, calendar) has EN and DE translations
- [ ] **TRANS-03**: All toast/notification messages has EN and DE translations
- [ ] **TRANS-04**: All form labels, validation messages, and button text has EN and DE translations

### Language Preference

- [ ] **LANG-01**: User can select language (English or German) in the Appearance & Language settings section
- [ ] **LANG-02**: Language preference is saved to backend via settings endpoint
- [ ] **LANG-03**: App loads language from backend preference on startup (defaults to EN if not set)

## Future Requirements

- **I18N-F01**: Date/time/number formatting per locale
- **I18N-F02**: Additional languages beyond EN and DE
- **I18N-F03**: Browser language detection as fallback
- **I18N-F04**: Pluralization rules for complex translations

## Out of Scope

| Feature | Reason |
|---------|--------|
| Date/time/number formatting per locale | Only text localization in this milestone |
| URL-based locale routing | Language is user preference, not URL-routed |
| RTL support | Not needed for EN/DE languages |
| Browser language detection | Using backend preference only for simplicity |
| Additional languages beyond EN/DE | Scoped to two languages; extensible later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| I18N-01 | — | Pending |
| I18N-02 | — | Pending |
| I18N-03 | — | Pending |
| TRANS-01 | — | Pending |
| TRANS-02 | — | Pending |
| TRANS-03 | — | Pending |
| TRANS-04 | — | Pending |
| LANG-01 | — | Pending |
| LANG-02 | — | Pending |
| LANG-03 | — | Pending |

**Coverage:**
- v0.2 requirements: 10 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 10

---
*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 after initial definition*

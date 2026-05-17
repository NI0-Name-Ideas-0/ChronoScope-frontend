# Roadmap: ChronoScope v0.2 — Internationalization (EN and DE only)

**Milestone:** v0.2
**Phases:** 3
**Requirements:** 10

---

## Phase 1: Transloco infrastructure and runtime switching

**Goal:** Users experience a working i18n system where all UI text is served from translation keys with lazy-loaded locale files and runtime language switching.

**Depends on:** Nothing

**Requirements:** I18N-01, I18N-02, I18N-03

**Success criteria:**
1. All user-visible UI text renders from Transloco translation keys (no hardcoded strings remain)
2. Translation files load on demand per locale — switching to DE does not require loading EN file and vice versa
3. Changing the active language updates all visible text instantly without a page reload
4. The app boots and displays English text by default when no preference is set

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Install Transloco, configure provider and loader, create translation files
- [ ] 01-02-PLAN.md — Replace hardcoded strings in navbar, topbar, list-view, task-modal, link-account, notifications
- [ ] 01-03-PLAN.md — Replace hardcoded strings in settings-modal and all settings sections

**UI hint**: yes

---

## Phase 2: Full EN and DE translation coverage

**Goal:** Users see correct, complete English and German translations for every piece of text in the application — navigation, tasks, notifications, forms, and settings.

**Depends on:** Phase 1

**Requirements:** TRANS-01, TRANS-02, TRANS-03, TRANS-04

**Success criteria:**
1. Navigation links, settings labels, and layout elements display correct text in both EN and DE
2. Task-related screens (create, edit, list, calendar views) display correct text in both EN and DE
3. Toast and notification messages appear in the active language (EN or DE)
4. Form labels, validation error messages, and button text display in the active language
5. No untranslated keys or placeholder text visible when browsing the full app in either language

**Plans:**
- (Not planned yet)

**UI hint**: yes

---

## Phase 3: Language preference persistence

**Goal:** Users can choose their language in settings, have it remembered by the backend, and see that preference restored automatically on next login.

**Depends on:** Phase 1

**Requirements:** LANG-01, LANG-02, LANG-03

**Success criteria:**
1. User can select English or German from a language selector in the Appearance & Language settings section
2. Selecting a language immediately switches the UI and saves the preference to the backend
3. On app startup, the language loads from the backend preference and applies before the user interacts
4. If no backend preference is set, the app defaults to English

**Plans:**
- (Not planned yet)

**UI hint**: yes

---

*Roadmap created: 2026-05-17*

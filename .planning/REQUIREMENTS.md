# Requirements: ChronoScope

**Defined:** 2026-05-17
**Core Value:** Users can plan and schedule their tasks across organizations with automatic time-slot-aware planning

## v0.1 Requirements

Requirements for milestone v0.1: Toast Notifications.

### Notification Infrastructure

- [ ] **NOTIF-01**: User sees a toast notification container in the top-right of the app
- [ ] **NOTIF-02**: Toasts support four types: success, error, info, warning
- [ ] **NOTIF-03**: User can dismiss toasts manually via a close button
- [ ] **NOTIF-04**: Toasts auto-dismiss after a configurable duration
- [ ] **NOTIF-05**: Toasts are accessible (aria-live regions, keyboard navigable, color contrast)

### Error Handling

- [ ] **ERR-01**: API errors automatically show error toasts via an HTTP interceptor
- [ ] **ERR-02**: Callers can opt out of automatic error toasts for inline error handling

### Success Integrations

- [ ] **INTEG-01**: Saving work slot preferences shows a success toast on success and an error toast on failure
- [ ] **INTEG-02**: Planning operations show an error toast on failure (success is silent — tasks just reload)
- [ ] **INTEG-03**: Task creation shows a success toast
- [ ] **INTEG-04**: Task update shows a success toast
- [ ] **INTEG-05**: Task deletion shows a success toast

### Message Quality

- [ ] **MSG-01**: API error toasts display ProblemDetail content (detail/title) instead of generic messages
- [ ] **MSG-02**: All notification messages are clear, user-friendly, and context-specific

### Enhanced Error Display

- [x] **ERRX-01**: Error toasts use errorCode-mapped user-friendly messages synced with backend titles
- [ ] **ERRX-02**: Validation error toasts display per-field errors (field name + error message) inline
- [x] **ERRX-03**: errorCode and type URI from ProblemDetail are exposed to callers for programmatic error handling
- [ ] **ERRX-04**: All new error parsing paths have minimal test coverage

## Future Requirements

- **NOTIF-F01**: Persistent notification center / history log
- **NOTIF-F02**: Undo action support on certain toasts
- **NOTIF-F03**: Copy error details to clipboard from error toasts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Push notifications / browser Notification API | ChronoScope toasts are in-app only |
| Notification preferences / settings | Overkill for v0.1; all toasts use sensible defaults |
| User-to-user messaging | Not part of ChronoScope's scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NOTIF-01 | Phase 1 | Pending |
| NOTIF-02 | Phase 1 | Pending |
| NOTIF-03 | Phase 1 | Pending |
| NOTIF-04 | Phase 1 | Pending |
| NOTIF-05 | Phase 1 | Pending |
| ERR-01 | Phase 2 | Pending |
| ERR-02 | Phase 2 | Pending |
| INTEG-01 | Phase 2 | Pending |
| INTEG-02 | Phase 2 | Pending |
| INTEG-03 | Phase 2 | Pending |
| INTEG-04 | Phase 2 | Pending |
| INTEG-05 | Phase 2 | Pending |
| MSG-01 | Phase 3 | Pending |
| MSG-02 | Phase 3 | Pending |

| ERRX-01 | Phase 4 | Complete |
| ERRX-02 | Phase 4 | Pending |
| ERRX-03 | Phase 4 | Complete |
| ERRX-04 | Phase 4 | Pending |

**Coverage:**
- v0.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 after initial definition*

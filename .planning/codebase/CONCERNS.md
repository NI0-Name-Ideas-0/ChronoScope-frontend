# CONCERNS

**Analysis Date:** 2026-05-16

## Executive summary

This document lists the top risks, technical debt, and fragile areas discovered during a focused scan of the codebase. The list below summarizes the top 10 items (ordered roughly by severity and immediate risk):

1. Persistent OAuth tokens stored in `localStorage` and verbose debug logging (High)
2. Unsafe HTML bypass via `DomSanitizer.bypassSecurityTrustHtml` (High)
3. Hardcoded API and Identity endpoints in the client code (Medium)
4. Debug logging enabled in OAuth config (`showDebugInformation: true`) (Medium)
5. Generated API client lacking request timeouts / cancellation (Medium)
6. Widespread use of `::ng-deep` and large component CSS (Maintainability / Performance) (Medium)
7. Error swallowing and inconsistent error propagation (Medium)
8. CI deploy-on-push to `main` with secrets gated only by branch (Operational risk) (Medium)
9. Large/monolithic UI components (e.g. `task-modal`) increasing maintenance cost (Medium)
10. Limited evidence of accessibility attributes across templates (e.g. no `aria-` usage found) (Medium)


---

## Detailed concerns

1) Persistent OAuth tokens in localStorage

- Severity: High
- Evidence:
  - `src/services/auth.ts` — `this.oauthService.setStorage(localStorage);` (line ~60)
  - `src/services/auth.ts` config uses OAuth in SPA mode and requests `offline_access` in scope
- Impact:
  - Storing tokens in `localStorage` exposes access and refresh tokens to any injected script (XSS). An attacker with XSS can exfiltrate tokens and impersonate users.
- Recommended next step:
  - Move token storage to a more secure context. Prefer HttpOnly secure cookies for refresh tokens and short-lived access tokens kept in memory or use `sessionStorage` with careful XSS controls. Add a threat model checklist for SPA auth and document token lifecycle in `src/services/auth.ts` or a dedicated security doc.


2) Unsafe HTML rendering via DomSanitizer.bypassSecurityTrustHtml

- Severity: High
- Evidence:
  - `src/pipes/safeHtml.pipe.ts` uses `this.sanitized.bypassSecurityTrustHtml(value);` (lines 6-10)
- Impact:
  - Bypassing Angular sanitization enables XSS if any untrusted content reaches the pipe. Even if currently unused, the presence of this pipe is a high risk if later reused on user-supplied content.
- Recommended next step:
  - Remove the pipe or restrict its use to tightly controlled trusted content. Add input validation and a documented use policy. Prefer built-in Angular sanitization (`[innerHTML]` with sanitized content) and avoid `bypassSecurityTrustHtml` unless the content is signed/trusted.


3) Hardcoded API and identity endpoints

- Severity: Medium
- Evidence:
  - `src/api/api-configuration.ts` sets `rootUrl: 'https://chronoscope.ni0.team/api'` (line 25)
  - `src/services/auth.ts` contains `issuer` and `tokenEndpoint` values (lines ~35-41)
- Impact:
  - Builds are tied to a single environment. Hardcoded endpoints reduce portability between staging/production and make local testing harder. They may also leak internal endpoints in client code history or snapshots.
- Recommended next step:
  - Parameterize root URLs via environment files or build-time configuration (`angular.json` file replacements or environment.ts). Provide documentation in `STRUCTURE.md` or a README about how to override `ApiConfiguration` and `Auth` settings for local and CI environments.


4) OAuth debug logging enabled

- Severity: Medium
- Evidence:
  - `src/services/auth.ts` contains `showDebugInformation: true` in the OAuth configuration (line ~58)
- Impact:
  - Detailed OAuth debug output may surface tokens, internal URLs, or other sensitive information in console logs, especially in production. This increases the attack surface and noisy logs.
- Recommended next step:
  - Gate `showDebugInformation` behind an environment flag (disabled in production). Update `src/services/auth.ts` to read a `debug` configuration value passed from environment/config.


5) API client: no timeouts or request cancellation

- Severity: Medium
- Evidence:
  - `src/api/api.ts` calls `firstValueFrom(obs)` and returns the response without timeout or cancellation hooks (lines ~58-63)
  - `RequestBuilder.build` constructs `HttpRequest` objects (`src/api/request-builder.ts`) but generated client does not add request-level timeouts
- Impact:
  - Hanging or very slow network requests will keep Promises unresolved; long-running calls can block user flows and create memory pressure. No standard retry/backoff or cancellation pattern increases brittleness under network issues.
- Recommended next step:
  - Introduce request timeouts and Http cancellation support. Use Angular's `HttpContext` or add an AbortController pattern (where supported). Add a central wrapper around `Api.invoke` that enforces timeouts and standardized retry/backoff.


6) Excessive use of ::ng-deep and large global-style CSS

- Severity: Medium
- Evidence:
  - `src/app/components/calendar-view/calendar/calendar.css` uses `:host ::ng-deep .fc` extensively and contains many global overrides
- Impact:
  - `::ng-deep` is deprecated and allows style leakage across components. Large stylesheets with deep selectors hinder encapsulation, make reason about styling harder, and may cause performance issues in complex pages.
- Recommended next step:
  - Audit styles that rely on `::ng-deep`. Where possible move styles to the global stylesheet with explicit scoping or use component inputs / classes instead of deep selectors. Document styling conventions and avoid `::ng-deep` in new components.


7) Error swallowing and inconsistent error propagation

- Severity: Medium
- Evidence:
  - `src/services/task.service.ts` `loadTasks()` catches errors and only `console.error('Error loading tasks from backend:', error);` then returns (lines ~119-121)
  - Several other services log errors but do not surface them to callers (e.g. plan methods catch errors and do not rethrow)
- Impact:
  - Silent failures make debugging and CI validation harder. UX may show stale data with no clear error state and developers may miss backend regressions.
- Recommended next step:
  - Implement a central error handling strategy: create an `ErrorService` to capture and surface user-facing errors and integrate optional reporting (Sentry or logging). Adjust critical flows to return error results or propagate exceptions rather than only logging.


8) CI/CD: automatic deploy step runs on pushes to `main`

- Severity: Medium
- Evidence:
  - `.github/workflows/ci.yml` contains a `deploy` job that runs `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` and uses secrets (`HOST_IP`, `SSH_USER`, `DEPLOY_KEY`) (lines ~34-52)
- Impact:
  - Direct pushes to `main` automatically trigger deployment. If test coverage is incomplete or `main` is not strictly protected, accidental or malicious pushes may deploy broken code.
- Recommended next step:
  - Enforce branch protections, require PR reviews and passing CI before merging. Add manual approval step for production deploy or a protected environment (environments / required reviewers in GitHub Actions). Ensure secrets are stored and rotated in GitHub Secrets.


9) Monolithic UI components and long files

- Severity: Medium
- Evidence:
  - `src/app/components/task-modal/task-modal.ts` appears in the "largest files" and long components lists
  - `src/services/task.service.ts` is large and handles many responsibilities (business logic + API orchestration + local storage)
- Impact:
  - Large files are harder to maintain and test. They increase chance of merge conflicts and slow developer onboarding.
- Recommended next step:
  - Identify the largest components (`task-modal.ts`, `task.service.ts`, `calendar.ts`) and split responsibilities: break UI into smaller presentational components and move domain logic to services/util modules. Add module-level tests while refactoring.


10) Accessibility signals missing / limited ARIA usage

- Severity: Medium
- Evidence:
  - A repository-wide search for `aria-` in HTML templates returned no matches (no `aria-` attributes found within `.src` `.html` files in the scan)
- Impact:
  - Lack of ARIA attributes and accessibility checks may cause the UI to be unusable for assistive technology users and fail accessibility compliance.
- Recommended next step:
  - Run an automated accessibility scanner (axe or pa11y) on representative pages. Add `aria-*` attributes and keyboard focus management to interactive elements (modals, custom calendar elements). Add accessibility linting and include in CI checks.


---

## Security & privacy issues

- No `.env` or credentials files were found in the repo root during the scan. (No sensitive files were read or printed.)
- High-risk items:
  - OAuth tokens stored in `localStorage` (`src/services/auth.ts`) — High
  - `DomSanitizer.bypassSecurityTrustHtml` in `src/pipes/safeHtml.pipe.ts` — High
  - `showDebugInformation: true` in `src/services/auth.ts` — Medium
- Privacy note:
  - Local state persisted in `localStorage` (`chronoscope-completion`, `chronoscope-theme`) may contain user activity metadata. Evaluate retention and provide user-facing controls if required by privacy policy (`src/services/task.service.ts`, `src/services/theme.service.ts`).


---

## Accessibility & performance hot spots

- Performance:
  - Large component stylesheets (`src/app/components/calendar-view/calendar/calendar.css`) and heavy `::ng-deep` usage can cause style recalculation overhead.
  - Bulk parallel planning requests (`planOrganizationsAndReload` in `src/services/task.service.ts`) use `Promise.all` for many orgs which may spike backend load; consider batching.
- Accessibility:
  - No `aria-` attributes detected in scanned `.html` templates. Add role and ARIA attributes for custom interactive controls and ensure focus management for modals (`src/app/components/task-modal/`, `src/app/components/repetition-modal/`).


---

## Tests & CI fragility indicators

- Observations:
  - `package.json` test script runs `ng test` (script: `test: "ng test"`). Dev deps include `vitest` (line in `package.json`) which is not used by the script — inconsistency may confuse contributors.
  - There are many `.spec.ts` files (project test files exist) but the previous search counted many tests under `node_modules` too; ensure test runner is properly scoped.
  - CI (`.github/workflows/ci.yml`) runs `pnpm test --watch=false` and deploys on `push` to `main`. This pipeline assumes tests are fast and deterministic; no separate lint/test/coverage gates were visible.
- Impact:
  - Tests may be flaky or slow; inconsistent test runners (Karma/Jasmine vs. Vitest) complicate local development and CI. Deploy-on-push increases blast radius of test flakiness.
- Recommended next steps:
  - Standardize on a single test runner and make `pnpm test` deterministic; add `--silent`/headless flags for CI if needed.
  - Add test timeouts and a faster unit test subset that runs on PRs; run slower integration tests on scheduled jobs.
  - Add linting and (optionally) coverage thresholds to CI. Protect `main` branch and require passing checks before deploy.


---

## Prioritized remediation plan (quick wins)

1. Disable `showDebugInformation` in production builds and gate it behind a config flag in `src/services/auth.ts`. (Low effort)
2. Remove or restrict `bypassSecurityTrustHtml` use; search for any `[innerHTML]` usage and ensure inputs are validated. (High priority for security)
3. Move OAuth token storage away from `localStorage` or document and mitigate XSS (CSP, sanitize inputs). (High priority)
4. Add request timeouts / cancellation to `Api.invoke` wrapper and standardize error bubbling. (Medium effort)
5. Protect `main` and require PR reviews; add manual approval for deploy step in `.github/workflows/ci.yml`. (Low effort)


---

## Files inspected (non exhaustive)

- `src/services/auth.ts` (OAuth configuration, token storage)
- `src/pipes/safeHtml.pipe.ts` (DomSanitizer bypass)
- `src/api/api-configuration.ts` (hardcoded rootUrl)
- `src/api/api.ts`, `src/api/request-builder.ts` (generated client)
- `src/services/task.service.ts` (business logic, localStorage, planning requests)
- `src/app/components/calendar-view/calendar/calendar.css` (large styles, ::ng-deep)
- `.github/workflows/ci.yml` (CI and deploy)
- `package.json` (scripts and dependencies)


---

*Concerns audit: 2026-05-16*

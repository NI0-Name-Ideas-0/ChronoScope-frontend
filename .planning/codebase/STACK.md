STACK

**Analysis Date:** 2026-05-16

Summary

This repository is an Angular single-page application (Angular v21) using TypeScript (TS ~5.9). It is built with the Angular build system, styled with Tailwind/DaisyUI, and communicates with a REST API using an ng-openapi-gen generated client.

Languages & Frameworks

- Primary: TypeScript ~5.9.2 — declared in `package.json` (devDependencies) and `tsconfig.json` (`target: ES2022`).
- Framework: Angular ^21.2.5 — declared in `package.json` (dependencies) and configured in `angular.json` (project: `ChronoScope-frontend`).
- UI library / styling: TailwindCSS ^4.2.2 (devDependency) and DaisyUI ^5.5.19 (dependency) — referenced in `package.json` and used from `src/styles.css`.
- Calendar UI: FullCalendar (@fullcalendar/*) ^6.1.20 — declared in `package.json` and used in `src/app/components/calendar-view/calendar/calendar.ts`.

Build & Tooling

- Package manager: pnpm (package manager field in `package.json`: `pnpm@10.33.0`). Lockfiles: `pnpm-lock.yaml` present (also `package-lock.json` exists).
- Build system: Angular Build (`@angular/build`) configured in `angular.json` (builder `@angular/build:application`). Output mode set to `static` in `angular.json`.
- Scripts (declared in `package.json`):
  - `start`: `ng serve` — local dev server
  - `build`: `ng build` — production build
  - `watch`: `ng build --watch --configuration development`
  - `test`: `ng test` — runs unit tests (Vitest via Angular builder)
  - `serve:ssr:ChronoScope-frontend`: Node server command for SSR output (present but server code not in repo)
- Dev server: `ng serve` (see `README.md` and `package.json` `start`).

Tooling (formatting, linting, tests, CI)

- Formatter: Prettier ^3.8.1 — config at ` .prettierrc`.
- Linting: No ESLint configuration detected in repository root (no `.eslintrc.*` found).
- Test runner: Vitest ^4.0.8 — declared in `package.json` (devDependencies). Tests are executed via `ng test` (see `README.md` and `angular.json` `test` builder `@angular/build:unit-test`). Example spec files live under `src/services/*.spec.ts` and `src/app/*.spec.ts`.
- CI: GitHub Actions workflow at `.github/workflows/ci.yml` — installs pnpm, uses Node 22, runs `pnpm install` and `pnpm test` and includes a deploy job using `appleboy/ssh-action` with secrets.

Notable dependencies (purpose + code references)

- `@angular/*` (^21.x) — core framework. Declared in `package.json` and used across `src/` (e.g. `src/app/app.ts`, `src/app/app.config.ts`).
- `angular-oauth2-oidc` (^20.0.2) — OpenID Connect client used for authentication. Configured in `src/services/auth.ts` and registered in `src/app/app.config.ts` (provider `provideOAuthClient`).
- `ng-openapi-gen` (^1.0.5) — OpenAPI generator used to generate a typed API client. Generated client files are under `src/api/` (e.g. `src/api/api.ts`, `src/api/api-configuration.ts`, `src/api/functions.ts`).
- `@fullcalendar/angular`, `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/rrule` (^6.1.20) — calendar UI and plugins; usage in `src/app/components/calendar-view/calendar/calendar.ts`.
- `rrule` (^2.8.1) — recurrence rule parsing and generation; used in `src/services/task.service.ts` and calendar integration.
- `tailwindcss` (dev) and `daisyui` — utility-first styling and themeing. Tailwind usage and DaisyUI theming are in `src/styles.css`.
- `cally` (^0.9.2) — scheduling/planning helper listed in `package.json` (usage not obvious in top-level scanned files).
- `vitest` — test runner (see `package.json` and `tsconfig.spec.json` referring to `vitest/globals`).

Runtime Targets & Browser Support

- TypeScript target: `ES2022` (see `tsconfig.json` `compilerOptions.target`).
- Angular v21 is modern; there is no project-level `browserslist` file detected. `angular.json` specifies `outputMode: static` and `tsConfig: tsconfig.app.json`.
- Node used in CI: Node 22 (see `.github/workflows/ci.yml`).

Environment & Configuration

- Environment files: `src/environments/environment.ts` (development) and `src/environments/environment.prod.ts` (production). These contain `apiUrl` and `production` flags and are used by `src/app/app.config.ts` with `provideApiConfiguration(environment.apiUrl)`.
- Secrets / CI secrets: Deployment workflow references GitHub secrets (`HOST_IP`, `SSH_USER`, `DEPLOY_KEY`, `SSH_PASSPHRASE`) in `.github/workflows/ci.yml` (do not inspect secret values).

How to run locally

- Install dependencies (recommended): `pnpm install` (project `package.json` declares `packageManager: pnpm@10.33.0`).
- Start dev server: `pnpm start` or `ng serve` (script `start` in `package.json`).
- Build production: `pnpm build` or `ng build`.
- Run tests: `pnpm test` or `ng test` (Vitest runner via Angular test builder).

References (key files)

- `package.json` (scripts, dependencies)
- `angular.json` (build/serve/test configuration)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` (TS config and path aliases)
- `src/environments/environment.ts`, `src/environments/environment.prod.ts` (apiUrl, production flag)
- `src/app/app.config.ts` (passport for API client and OAuth provider configuration)
- `src/services/auth.ts` (OAuth2/OpenID Connect configuration)
- `src/api/` (generated OpenAPI client)
- `src/app/components/calendar-view/calendar/calendar.ts` and `src/services/task.service.ts` (calendar + rrule integrations)
- `.github/workflows/ci.yml` (CI)

*Stack analysis: 2026-05-16*

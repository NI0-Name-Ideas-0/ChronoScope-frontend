CONVENTIONS

**Analysis Date:** 2026-05-16

## TypeScript & Compiler Settings (observed)
- `tsconfig.json` enables strict TypeScript checks:
  - `"strict": true`, `"noImplicitReturns": true`, `"noFallthroughCasesInSwitch": true` (`tsconfig.json`, lines with compilerOptions)
  - Angular compiler strictness set: `"strictInjectionParameters": true`, `"strictInputAccessModifiers": true`, `"strictTemplates": true` (`tsconfig.json`)
- Target/Module: `target: ES2022`, `module: preserve` (`tsconfig.json`).
- Path aliases are configured in `tsconfig.json` `baseUrl: "src"` and `paths`: `@app/*`, `@api/*`, `@services/*`, `@components/*`, `@pipes/*` — use these aliases when adding new code.
- Test types: `tsconfig.spec.json` includes `"types": ["vitest/globals"]` which indicates Vitest globals (vi, describe, it) are available in test builds.

Files: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`

## Framework & Angular patterns
- Angular v21 (project dependencies in `package.json`) — app is an Angular application (`angular.json` project `ChronoScope-frontend`).
- Project uses Angular standalone components pattern (tests and component module-less imports use `imports: [Component]` rather than NgModule). Example tests: `src/app/app.spec.ts`, `src/app/components/main/main.spec.ts`.
- Components use co-located templates and styles: e.g. `src/app/components/main/main.ts`, `main.html`, `main.css`.
- Services live under `src/services` and API client under `src/api` (generated via `ng-openapi-gen` per `scripts/generate-api-services.sh`).

Paths referenced: `src/app/*`, `src/services/*`, `src/api/*`.

## Folder & File Naming
- Files use lower-kebab-case for components and assets: `main.ts`, `main.html`, `main.spec.ts` (see `src/app/components/*`).
- TypeScript implementation files use `.ts`; component templates use `.html` and styles use `.css` alongside component files.
- Test files are co-located with implementation and named `*.spec.ts` (e.g. `src/app/app.spec.ts`, `src/app/components/link-account/link-account.spec.ts`).

## Formatting & Linting
- Prettier is configured: `.prettierrc` exists with `printWidth: 100` and `singleQuote: true`. It also overrides HTML parsing for Angular templates (`parser: "angular"`). File: `.prettierrc`.
- ESLint: No ESLint configuration detected at repository root (`.eslintrc.*`, `eslint.config.*` files not found). No `eslint` dependency in `package.json` devDependencies. Recommended: add ESLint with `@angular-eslint` and align rules with Prettier.
- Package manager: `pnpm` (enforced by `package.json` `packageManager` field and used in CI). File: `package.json`.

Files: `.prettierrc`, `package.json`

## Testing Conventions (brief, also covered in TESTING.md)
- Tests are co-located next to components: `*.spec.ts` next to each component file (e.g. `src/app/components/*/*/*.spec.ts`).
- Tests use Angular testing utilities (`TestBed`) and Vitest globals (`vi`) for mocking.
- Mocking style: inline mock objects passed as providers to TestBed (see `src/app/app.spec.ts`, `src/app/components/main/main.spec.ts`).

## Accessibility (observations)
- Some accessibility attributes present: images include `alt` text (e.g. `src/app/components/topbar/topbar.html` `<img alt="ChronoScope logo" />`).
- No repository-level accessibility tooling detected: no `axe-core`, `jest-axe`, `@axe-core/puppeteer`, or accessibility linter plugins configured.
- No ARIA-focused helper utilities or global accessibility test setup detected.

Files: `src/app/components/topbar/topbar.html`

## Commit/CI conventions
- CI runs tests on push and PRs to `main` using `.github/workflows/ci.yml`. The workflow installs pnpm, Node 22 and runs `pnpm test --watch=false` (`.github/workflows/ci.yml`).
- No commit message linting or conventional-commit enforcement found (no `commitlint`, `husky`, or `semantic-release` configurations).

Files: `.github/workflows/ci.yml`

## Recommendations (prioritized)
1. Add ESLint with Angular rules: Install and configure `eslint`, `@angular-eslint/eslint-plugin`, `@angular-eslint/eslint-plugin-template`, and use `eslint-config-prettier` to avoid conflicts with Prettier. Place config at `.eslintrc.cjs` or `.eslintrc.json`.
   - Enforce accessibility checks with `eslint-plugin-jsx-a11y` adapted for Angular via `@angular-eslint` rules.
   - Target files: `src/**/*.ts`, `src/**/*.html` (templates)
   - Files to update: create `.eslintrc.cjs` at repo root.

2. Add an accessibility testing step: integrate `axe-core` via Playwright/Cypress or unit tests with `@axe-core/puppeteer` for critical pages/components.
   - Add a test helper at `test/setup-accessibility.ts` and CI step to run accessibility checks against a built preview.

3. Add commit hooks and commit message validation:
   - `husky` + `commitlint` to enforce Conventional Commits, add simple pre-commit lint-staged hook to run `pnpm -w lint`.

4. Add explicit lint and format scripts to `package.json`:
   - `"lint": "eslint 'src/**/*.{ts,html}' --fix"`
   - `"format": "prettier --write 'src/**/*.{ts,html,css,json,md}'"`

5. Centralize test mocking utilities and setup:
   - Add `test/setup.ts` (registered via Vitest or Angular test builder) that establishes common mocks (e.g., mock localStorage, global providers) and registers `vi` globals if necessary.

6. Document naming conventions and where to put new code in `STRUCTURE.md` (this improves onboarding and enforceability of patterns).

## Inconsistencies / Missing Conventions
- No ESLint (static linting) configuration — reliance on Prettier only for formatting.
- No accessibility linting or automated checks.
- No commit message/PR validation beyond CI test run.
- No repository-wide TypeScript or style rules beyond `tsconfig` and Prettier; adding ESLint will make rules prescriptive.


*End of conventions (analysis date: 2026-05-16)*

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Angular v20+ defaults to standalone components. Do not explicitly set standalone: true
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection


# ChronoScope Frontend Project context information

## Project Overview
ChronoScope is a browser-based task planning system developed as part of a software engineering project.

The goal of the application is to support structured task management and planning. The system will include features such as task organization, scheduling, and handling dependencies between tasks. Some features are still being defined and may evolve over time.

About Organizations:
- The concept of organizations is central to ChronoScope. Users can belong to multiple organizations.
- Organizations are only relevant for licensing and planning purposes.
  - The organization a user belongs to provides them with a license that grants access to the application.
  - The user can configure exact time slots to an organization. (Something like "I want to spend 4 hours per week on organization X, and 2 hours per week on organization Y")
  - An organization does not assign tasks to users. Users create tasks themselves and assign them to those organizations so the algorithm can take the organizational time slot preferences into account when scheduling.

General:
- There is no user to user or user to organization interaction in the application. I.e. no messaging, no sharing of tasks, no team features, no organization management features, etc.


This is not a simple prototype - the frontend should resemble a modern, clean SaaS-style application.

---

## Tech Stack (Frontend Context)

- Angular 21
- TypeScript
- Tailwind CSS
- DaisyUI (optional, may be used but not required)

If you don't know much about DaisyUI or find it not suitable for a component, prefer custom Tailwind-based implementations.

---

## Code & Architecture Guidelines

### Component Design
- Prefer **small, reusable components**
- Avoid monolithic components
- Keep logic and UI separated where reasonable

## UI / UX Vision
- The UI should follow a **clean, minimalistic, modern design** with a slight “fancy” touch.
- Think about UX when building UI elements
- Always include both a light and dark variant of colors.
- Use Tailwind effectively for styling
- Suggest clean and modern UI implementations

### Code guidelines
- Follow Angular 21 and TypeScript best practices (see above)
- Use the latest Angular 21 features and APIs where appropriate
- Follow consistent structure and naming
- Keep code simple and maintainable

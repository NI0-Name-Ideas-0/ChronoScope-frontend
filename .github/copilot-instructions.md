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

This is not a simple prototype - the frontend should resemble a modern, clean SaaS-style application.

---

## UI / UX Vision

The UI should follow a **clean, minimalistic, modern design** with a slight “fancy” touch.

### Layout Concept
The current layout concept (subject to iteration):

- **Left Sidebar**
  - Icon-based navigation
  - Example sections:
    - Calendar View
    - Task List View
    - Profile
  - Keep it compact and intuitive

- **Top Bar**
  - Content not fully defined yet
  - Should be flexible and extensible

- **Main Content Area**
  - Split view:
    - Left: Task List
    - Right: Calendar View

This structure may evolve, so keep components modular and adaptable.

---

## Features (Evolving)

The application is expected to include:
- Task management (create, edit, complete tasks)
- Calendar-based planning
- Task dependencies
- Possibly more features (not fully defined yet)

---

## Design Principles

- Minimalistic UI with clear structure
- Avoid visual clutter
- Maintain consistency across components
- Subtle modern styling (not overly decorative)

---

## Tech Stack (Frontend Context)

- Angular
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

### State & Structure
- Keep state handling simple and readable
- Avoid unnecessary abstraction or overengineering
- Use clear data flow

### Naming & Readability
- Use descriptive names for variables, components, and functions
- Prioritize readability over cleverness

---

## Copilot Behavior Guidelines

When generating code, you should:

### DO:
- Suggest clean and modern UI implementations
- Create reusable and modular components
- Follow consistent structure and naming
- Keep code simple and maintainable
- Think about UX when building UI elements
- Use Tailwind effectively for styling

### DO NOT:
- Overengineer solutions
- Introduce unnecessary abstractions
- Generate overly complex or bloated code
- Create inconsistent or messy UI

---

## Flexibility & Iteration

This project is developed iteratively. Some aspects (features, UI details, top bar content, etc.) are not fully defined yet.

- Keep implementations flexible
- Avoid hardcoding assumptions
- Make it easy to extend or modify components later

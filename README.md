# ChronoScope Frontend

A modern, browser-based task planning application that supports structured task management, scheduling, and dependency handling. Built with Angular 21, Tailwind CSS, and DaisyUI.

## Features

- **Calendar View** — Visualize tasks on a weekly/daily calendar powered by FullCalendar
- **List View** — Manage tasks in a structured list with filtering and sorting
- **Task Scheduling** — Create one-off and recurring tasks with RRule support
- **Organization-Based Planning** — Assign tasks to organizations and configure time slot preferences for intelligent scheduling
- **Dark & Light Themes** — Full theme support with system preference detection
- **Internationalization** — Multi-language support via Transloco
- **OAuth2/OIDC Authentication** — Secure login via OpenID Connect

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 + DaisyUI 5 |
| State | Angular Signals |
| Auth | angular-oauth2-oidc |
| Calendar | FullCalendar 6 |
| i18n | @jsverse/transloco |
| Testing | Vitest + jsdom |
| API Client | ng-openapi-gen (auto-generated) |
| Package Manager | pnpm 10 |

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser. The app reloads automatically on file changes.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start dev server |
| `pnpm build` | Production build → `dist/` |
| `pnpm test` | Run unit tests (single run) |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm watch` | Build in watch mode (development) |

## Project Structure

```
src/
├── api/              # Auto-generated API client (ng-openapi-gen)
├── app/
│   ├── components/   # UI components
│   │   ├── calendar-view/   # FullCalendar-based schedule view
│   │   ├── list-view/       # Task list with filtering
│   │   ├── task-modal/      # Task create/edit dialog
│   │   ├── settings-modal/  # User settings
│   │   ├── navbar/          # Side navigation
│   │   ├── topbar/          # Top bar with actions
│   │   ├── notifications/   # Notification display
│   │   └── shared/          # Reusable UI primitives
│   ├── interceptors/ # HTTP interceptors
│   └── model/        # Domain models (Task, Scope, etc.)
├── environments/     # Environment configs
├── pipes/            # Custom pipes
├── services/         # Application services (auth, tasks, themes, etc.)
└── styles.css        # Global styles
```

## Development

### Code Style

- Standalone components (Angular 21 default)
- OnPush change detection
- Signal-based state management
- Reactive forms over template-driven
- Native control flow (`@if`, `@for`, `@switch`)

### Generating API Client

The API client in `src/api/` is auto-generated from an OpenAPI spec using `ng-openapi-gen`. Do not edit these files manually.

### Adding a New Component

```bash
ng generate component components/my-component
```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

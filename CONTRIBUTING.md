# Contributing Guide

Welcome! This guide outlines how we work on this codebase so changes stay clean, consistent, and easy to maintain.

## Principles

- Prefer readability over cleverness
- Keep responsibilities small and focused
- Type everything (inputs/outputs, API boundaries)
- Fail fast with clear error messages
- Avoid duplication; extract reusable parts early

## Branching & Commits

- Create feature branches: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`
- Use Conventional Commits:
  - `feat: add purchase history modal`
  - `fix: handle 406 login error`
  - `refactor: split dashboard into components`
  - `docs: update architecture overview`
  - `test: add auth slice unit tests`

## Folder Structure (moving towards domain-first)

```
src/
  app/                # App bootstrap, ErrorBoundary, providers
  components/         # Reusable/presentational components only
  domains/            # Feature areas (auth, platforms, orders, customers)
  repositories/       # Supabase access wrappers (no UI)
  hooks/              # Cross-domain hooks
  lib/                # Third-party clients (supabase, logger)
  routes/             # Router config & guards
  store/              # Redux toolkit slices & store
  validation/         # Zod schemas for forms & DTOs
  utils/              # Helpers & constants
  types/              # Shared & generated types
```

## Coding Standards

- Use TypeScript everywhere. No `any` unless justified with a comment and TODO for removal.
- Prefer composition over giant components. Extract:
  - Presentational components under `components/`
  - Data logic into `domains/<feature>/hooks` or `repositories/`
- Supabase calls are not allowed inside UI components. Use repositories/hook layers.
- Use `zod` for runtime validation of env and form inputs.
- Prefer pure functions and selectors for derived state.

### Logging

- Use `src/lib/logger.ts` for all application logs. Avoid raw `console.*` in code.
- Choose the lowest appropriate level: `debug` (verbose), `info` (lifecycle), `warn` (recoverable), `error` (failures).
- Include structured context as the second argument for easier debugging.
- Redact secrets and PII. Never log passwords or tokens.

### React

- Functional components with hooks only.
- Local UI state stays local; shared/cross-route state goes to Redux.
- Memoize expensive lists or use virtualization when needed.
- Keep components under ~200 lines; split when they grow.

### Redux Toolkit

- Keep slices thin; async calls via thunks or (future) RTK Query.
- Add selectors for derived state.
- Persist only what’s necessary (e.g., current user id), not entire objects.

### Error Handling & Logging

- Use `src/lib/logger.ts` (logger.info/warn/error) — no raw `console.log` except in development or setup scripts.
- Repositories return `{ ok: true, data } | { ok: false, error, code? }` — never throw inside UI.

### Styling & UI

- Tailwind utility classes. Extract frequently used patterns into `components/ui` primitives (Button, Modal, Table, Pagination, EmptyState, Loader).
- Accessibility first: labels, roles, focus traps for modals.

## Tests

- Use Vitest + React Testing Library.
- Minimum per change:
  - Reducer unit test for complex state updates
  - Component behavior test when logic branches are added

## Env & Types

- Environment variables validated in `src/config/env.ts` via Zod.
- Supabase client is typed via `src/types/database.types.ts` (generated).

## Review Checklist (PR author self-check)

- [ ] Follows Conventional Commits
- [ ] Types are accurate; no implicit anys
- [ ] No direct Supabase calls in components
- [ ] Errors logged via logger, not console
 - [ ] No stray `console.*` calls (except in test/dev scripts)
- [ ] Added/updated Zod schemas when adding inputs
- [ ] Updated docs if behavior changed (README/ARCHITECTURE)
- [ ] Added/updated tests when logic changed

Thanks for contributing! 🙌

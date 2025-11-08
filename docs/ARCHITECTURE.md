# Architecture Overview

This document provides a high-level overview of the application's structure, guiding principles, and conventions to help new contributors ramp up quickly.

## Core Principles

- **Domain Orientation**: Group code by business domain (auth, platforms, orders, customers) rather than technical layer when possible.
- **Type Safety First**: All API boundaries are typed using generated Supabase types + explicit domain models when shaping data for the UI.
- **Separation of Concerns**: Components focus on presentation; data fetching/mutations live in services or hooks; state orchestration in Redux slices.
- **Predictable State**: Global app state is minimal (auth, UI, cached entities). Transient UI state (modals, forms) lives locally or in dedicated hooks.
- **Progressive Hardening**: Start simple; layer optimizations (virtualization, memoization, caching) when actual bottlenecks appear.

## Directory Structure (Target State)

```
src/
  app/                # App bootstrap, providers, global ErrorBoundary
  components/         # Reusable presentational components (domain-agnostic)
    ui/               # Primitive UI building blocks (Button, Modal, Table, Badge)
    feedback/         # Loader, EmptyState, ErrorMessage
  domains/            # Domain-focused feature folders
    auth/
      components/
      hooks/
      services/
      slice.ts
      types.ts
    platforms/
      components/
      hooks/
      services/
      slice.ts
      types.ts
    orders/
    customers/
  repositories/       # Data access adapters wrapping Supabase client
  hooks/              # Cross-domain generic hooks
  lib/                # Third-party client configuration (supabase, logger)
  services/           # Transitional services (to be migrated into domains)
  store/              # Root store setup + middleware
  routes/             # Route configuration & guards
  validation/         # Zod schemas for forms & DTOs
  utils/              # Generic utilities (formatters, constants, helpers)
  types/              # Shared TypeScript types (generated + shared models)
  styles/             # Global styles or Tailwind config extensions
```

## Data Flow

```
[Component] -> [Hook] -> [Repository / Service] -> [Supabase]
                                 ↓
                           [Redux Slice]
                                 ↓
                           [Selectors / Hooks]
                                 ↓
                            [Component]
```

- Components never call Supabase directly.
- Repositories expose CRUD primitives returning typed results (success + data | error object).
- Hooks compose repository calls with UI state (loading, error, pagination, filters).
- Slices manage normalized collections where beneficial (e.g., users, platforms) and expose selectors.

## Supabase Layer

- `src/lib/supabase.ts` creates the typed client using generated `Database` types (`npm run db:gen`).
- Avoid embedding raw SQL in the frontend; use RPC (Edge Functions) or row-level security policies for sensitive operations.
- Remove legacy inline interfaces after type generation stabilization.

## State Management

- Redux Toolkit for global state that spans multiple routes (auth, entities).
- Local component state for ephemeral UI (open modals, input values) unless shared.
- Future: consider RTK Query or TanStack Query if caching & invalidation complexity grows.

## Error Handling

- Central `logger` utility to wrap `console` calls (silence in production except errors).
- Repository functions return discriminated unions: `{ ok: true, data } | { ok: false, error, code? }`.
- Global `ErrorBoundary` catches render errors; network errors surface via toast system.

## Forms & Validation

- Transition to `react-hook-form` + Zod schemas in `src/validation/`.
- Validation schemas co-located by domain (e.g., `domains/platforms/validation.ts`).

## Naming Conventions

| Concept        | Convention                       | Example                |
| -------------- | -------------------------------- | ---------------------- |
| Components     | PascalCase                       | `UserTable.tsx`        |
| Hooks          | `use` + PascalCase               | `useAuth()`            |
| Slices         | camelCase file exporting reducer | `authSlice.ts`         |
| Repositories   | `<entity>Repository.ts`          | `userRepository.ts`    |
| Types (domain) | Suffix with DTO if needed        | `CreateUserDto`        |
| Constants      | SCREAMING_SNAKE_CASE             | `LOW_STOCK_THRESHOLD`  |
| Selectors      | `select<Entity>...`              | `selectAdminCount`     |
| Zod Schemas    | `<Name>Schema`                   | `CreatePlatformSchema` |

## Styling & UI

- Tailwind utility-first; extract repeated patterns into UI primitives.
- Avoid deep nesting; prefer composition (e.g., `<Card><Card.Header/><Card.Body/></Card>` pattern if added later).

## Routing

- Central config exports route objects with `path`, `element`, `roles`, `layout`.
- A single `/dashboard` route dispatches to role-specific subviews instead of separate top-level routes.

## Performance Considerations

- Use `React.lazy` + Suspense for large feature panels.
- Memoize heavy lists; consider virtualization when row count > 100.
- Derive minimal props to reduce re-renders (selectors + shallow equality).

## Security Roadmap

- Replace plaintext password storage with Supabase Auth or custom hashing service.
- Tighten RLS policies per role & user ownership.
- Add audit logging for destructive operations (soft delete + restore).

## Testing Strategy

| Layer       | Tool                  | Scope                               |
| ----------- | --------------------- | ----------------------------------- |
| Unit        | Vitest                | Pure functions, reducers, selectors |
| Component   | React Testing Library | Hooks & component behavior          |
| Integration | (Future) Playwright   | Critical flows (auth, CRUD)         |

## Migration Guidelines

1. Add migration SQL under `supabase/migrations`.
2. Run `npm run db:push` to apply.
3. Regenerate types: `npm run db:gen`.
4. Update repositories & types.
5. Write/update Zod schemas.
6. Add or adjust tests.

## Progressive Refactor Plan

Refactors happen iteratively; maintain backward compatibility where possible. Mark deprecated modules with a JSDoc `@deprecated` tag and remove after stabilization.

---

This document should evolve; propose improvements via PR updating this file.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project (starting now) adheres to [Semantic Versioning](https://semver.org/).

Commit convention: we follow a lightweight variant of Conventional Commits:

- `feat:` new user-facing feature
- `fix:` bug fix
- `refactor:` code restructuring without behavior change
- `docs:` documentation only changes
- `test:` adding or refactoring tests
- `chore:` build, tooling, dependency updates

## [Unreleased]
### Planned
- Domain folder introduction (`src/domains/*`)
- Auth slice simplification (discriminated union state, reduced logging)
- Atomic inventory + purchase history updates via Supabase RPC
- Security hardening roadmap (password hashing, stricter RLS policies)
- Optional Storybook or style guide for UI primitives
- Expanded code comments & JSDoc for complex hooks and repositories
- Performance review (memoization & virtualization for large tables)

---

## [0.1.0] - 2025-11-09
### Added
- Vitest + Testing Library setup with initial tests (`platformRepository`, `authSlice`).
- Global `ErrorBoundary` and `ErrorDisplay` components for consistent error handling.
- `TableSkeleton` and other loading components for improved perceived performance.
- Environment diagnostics hook (`useEnvDiagnostics`) and dev-only banner component.
- Reusable `PurchaseHistoryTable` plus formatting helpers (`formatCurrency`, `formatDateTime`, `formatNumber`).
- Centralized constants (e.g. `LOW_STOCK_DEFAULT`, pagination defaults).
- Result helper utilities (`isOk`, unified RepoResult types) and DTOs for platform create/update operations.
- Path aliases in `tsconfig` & Vite config for cleaner imports.
- Supabase CLI workflow documentation in README.
- `.env.example` for environment variable onboarding.

### Changed
- Refactored `PlatformPanel` into smaller components & hooks (`usePlatforms`, extracted purchase history table, pagination logic moved).
- Standardized logging via `src/lib/logger.ts`; replaced stray `console.log` calls.
- Adopted Tailwind CSS v4 plugin integration (restored full utility build).
- ESLint configuration refined (import ordering warnings, React plugin setup, Prettier integration) without blocking development.
- Pagination logic extracted to reusable hook/util improving separation of concerns.

### Removed
- Deprecated/unused platform panel variant files (`PlatformPanelNew.tsx`, `PlatformPanelFixed.tsx` old backups) in favor of modular architecture.

### Fixed
- Missing Tailwind utilities after upgrade by adding official Vite Tailwind plugin.
- Inconsistent formatting & lint conflicts via Prettier + `eslint-config-prettier` integration.

### Internal
- Added Zod validation schemas for platform create/update and purchase forms (runtime safety & clearer error surfaces).
- Introduced DTO layer for repository operations increasing type safety at boundaries.
- Improved repository pattern consistency (single source of truth for success/error results).
- Added currency/date/number formatting utilities for consistent UI output.
- Updated README with architecture, logging guidelines, Supabase workflow, formatting & linting sections.

### Notes
- Import ordering currently emits warnings (intentional for gradual cleanup).
- Vite build warnings about dynamic/static import overlap (non-blocking) tracked for future chunk optimization.

## [0.0.0] - 2025-10-??
### Added
- Initial scaffold: React 19 + TypeScript + Vite setup.
- Basic authentication UI with role-based dashboards.
- Supabase client integration and initial types.

---

### Versioning Policy
- Patch (x.y.Z): bug fixes & internal refactors without breaking behavior.
- Minor (x.Y.z): new features and non-breaking improvements.
- Major (X.y.z): breaking changes (API/contract adjustments, structural migrations).

### Upgrade Guidance
Refer to this file when pulling updates; breaking changes will include migration notes.

---

### Contributing
See `CONTRIBUTING.md` for commit and PR guidelines. Changelog entries for new features should be added under `Unreleased` and moved to a tagged version when released.

# Logging Guidelines

This project uses a centralized logger (`src/lib/logger.ts`) for consistent, structured logs across the app. Avoid raw `console.*` in application code.

## Levels

- `logger.debug(...)` – verbose diagnostic details (dev-only contexts)
- `logger.info(...)` – notable lifecycle events, feature usage
- `logger.warn(...)` – recoverable issues, degraded UX, fallback paths
- `logger.error(...)` – failures, exceptions, API/database errors

## Usage

```ts
import { logger } from '@/lib/logger'; // or relative path ../lib/logger if no path aliases yet

logger.info('Fetching platforms...', { page, pageSize });
try {
  // ...
} catch (err) {
  logger.error('Failed to fetch platforms', err);
}
```

Prefer logging a short, stable message string first, then structured context as a second parameter. The logger decides how to print (e.g., JSON in production, formatted in dev).

## Do

- Use the logger in repositories, services, and non-trivial UI flows
- Redact secrets: never log tokens, passwords, or anon keys
- Add context objects instead of building mega-strings
- Log once per failure site — avoid duplicate error spam

## Don’t

- Don’t use `console.log` in app code (tests/scripts are okay)
- Don’t swallow errors silently — warn or error with context
- Don’t log PII unless strictly necessary (and never in client logs)

## Migration Tips

- Replace `console.error('msg', e)` with `logger.error('msg', e)`
- Replace `console.log('state', s)` with `logger.debug('state', s)`
- Keep messages consistent so search/filters work across the codebase

## Monitoring (future)

When server-side logging exists (Edge Functions/RPC), mirror level semantics and forward `error` events to monitoring providers (Sentry, Logflare, etc.).

This folder contains SQL assets that are not wired into automated migrations but may be useful for manual database maintenance or reference.

- `add_low_stock_alert_migration.sql`: Draft migration for low-stock alert feature. Review and convert to a numbered Supabase migration if adopting.
- `complete_schema.sql`: Snapshot/reference of the full database schema at a point in time.

Usage notes:

- Prefer creating numbered migrations via `npm run db:new` and `npm run db:push`.
- Keep manual scripts small and documented, or promote them into proper migrations.

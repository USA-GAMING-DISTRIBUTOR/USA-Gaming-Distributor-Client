# Repository cleanup (2025-11-09)

This commit removes unused components and reorganizes stray SQL assets.

Removed (unused):

- `src/components/PlatformPanelFixed.tsx` and `*.bak`
- `src/components/PlatformPanelNew.tsx` and `*.bak`
- `src/components/PlatformPanelWithHistory.tsx` and `*.bak`
- `src/components/ReportsPanel.tsx`
- `src/components/ActivityLogPanel.tsx`
- `src/utils/supabaseTest.ts`

Moved:

- `add_low_stock_alert_migration.sql` -> `supabase/manual/add_low_stock_alert_migration.sql`
- `complete_schema.sql` -> `supabase/manual/complete_schema.sql`

Rationale:

- No imports or routes referenced these components; `CHANGELOG.md` marked variants deprecated.
- SQL files at project root were not wired to build or Supabase migration flow.

Follow-ups:

- If you plan to adopt the low stock feature, turn the manual SQL into a proper numbered migration (`npm run db:new`).
- Consider running a history rewrite (BFG or git filter-repo) to purge removed files' blobs from git history. See below.

## Git history rewrite (optional but requested)

Use BFG (faster) or git filter-repo to remove deleted files from history.

### Option A: BFG Repo-Cleaner

1. Create a fresh mirror:
   ```powershell
   git clone --mirror . ..\repo-mirror ; cd ..\repo-mirror
   ```
2. Remove files by path patterns:
   ```powershell
   java -jar bfg.jar --delete-files "PlatformPanel*" --delete-folders ".Trash" --no-blob-protection
   java -jar bfg.jar --delete-files "ReportsPanel.tsx,ActivityLogPanel.tsx,supabaseTest.ts" --no-blob-protection
   ```
3. Clean and force-push:
   ```powershell
   git reflog expire --expire=now --all ; git gc --prune=now --aggressive ; git push --force
   ```

### Option B: git filter-repo (recommended)

Install `git-filter-repo` and run targeted removals:

```powershell
# Example: remove specific paths across history
git filter-repo --invert-paths --path src/components/PlatformPanelFixed.tsx --path src/components/PlatformPanelNew.tsx --path src/components/PlatformPanelWithHistory.tsx --path src/components/ReportsPanel.tsx --path src/components/ActivityLogPanel.tsx --path src/utils/supabaseTest.ts
```

Then force-push and have collaborators re-clone.

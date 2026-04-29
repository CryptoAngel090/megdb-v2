# Repository Map Snapshot (2026-04-29)

## Scope
- Source: tracked files from `git ls-files` (repo root).
- Files indexed: `502`
- Folders indexed: `147`
- Registry format: `file -> role -> risk -> size -> uses/used_by`

## Generated Artifacts
- `reports/repo-map/files.txt` - all tracked files.
- `reports/repo-map/folders.txt` - all folders derived from tracked files.
- `reports/repo-map/line-counts.csv` - line count per file (`-1` for non-text/binary-read failures).
- `reports/repo-map/imports-exports-counts.csv` - import/export counts per source file.
- `reports/repo-map/imports-by-file.csv` - raw import lines per source file.
- `reports/repo-map/exports-by-file.csv` - raw export lines per source file.
- `reports/repo-map/import-edges.csv` - import edges (`from -> to`) from source files.
- `reports/repo-map/critical-entrypoints.csv` - curated critical entrypoints with role/risk/size/usage.
- `reports/repo-map/registry-file-role-risk-size-uses-usedby.csv` - full registry.

## Critical Entrypoints Marked

### app/*
- Root app entry: `apps/web/src/app/layout.tsx`
- Root boundaries: `apps/web/src/app/loading.tsx`, `apps/web/src/app/error.tsx`, `apps/web/src/app/not-found.tsx`
- Site group: `apps/web/src/app/(site)/layout.tsx`
- Detail group: `apps/web/src/app/(detail)/layout.tsx`
- Critical routes:
  - `apps/web/src/app/(site)/movies/page.tsx`
  - `apps/web/src/app/(detail)/movie/[id]/page.tsx`

### Route Groups
- `(site)`: `apps/web/src/app/(site)/**`
- `(detail)`: `apps/web/src/app/(detail)/**`

### layout.tsx / loading.tsx / error.tsx
- Root: `apps/web/src/app/layout.tsx`, `apps/web/src/app/loading.tsx`, `apps/web/src/app/error.tsx`
- Detail route: `apps/web/src/app/(detail)/movie/[id]/loading.tsx`, `apps/web/src/app/(detail)/movie/[id]/error.tsx`
- Movies route loading: `apps/web/src/app/(site)/movies/loading.tsx`

### SEO Scripts
- Verification/reporting cluster: `apps/web/scripts/verify-seo-*.mjs`
- Orchestration scripts:
  - `apps/web/scripts/seo-smoke.mjs`
  - `apps/web/scripts/seo-nightly.mjs`
  - `apps/web/scripts/seo-weekly-audit.mjs`
  - `apps/web/scripts/seo-monitor-regression.mjs`
  - `apps/web/scripts/verify-route-chunk-budget.mjs`

### next.config.*
- `apps/web/next.config.mts`
- `apps/admin/next.config.mts`

### middleware.*
- `apps/web/src/middleware.ts`

### db schema / migrations
- Schema source: `packages/db/src/schema/index.ts`
- Migrations: `packages/db/drizzle/*.sql`
- Migration metadata: `packages/db/drizzle/meta/*`

### generated CSS / tokens
- `apps/web/src/styles/design-tokens.generated.css`
- `theme/generated/tokens.css`
- `theme/generated/tailwind.tokens.json`
- `theme/tokens/classes.generated.json`

## Notes
- `used_by` in the full registry is heuristic (import string matching), so treat it as directional signal, not perfect semantic resolution.
- For exact dependency tracing, use `import-edges.csv` plus targeted symbol search.

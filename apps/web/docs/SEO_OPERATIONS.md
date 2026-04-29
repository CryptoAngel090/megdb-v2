# SEO Operations (All Pages)

For the concrete fail/warn QA process, see `docs/SEO_QA_RUNBOOK.md`.

This project enforces SEO at 4 layers:

1. **Code contracts** (`verify:jsonld`, `verify:seo:*`)  
2. **Runtime smoke** (`verify:seo:smoke`)  
3. **External webmaster loop** (`seo:webmaster:*`)  
4. **Regression monitoring** (`verify:seo:monitor`)

Hard startup gates are enabled:

- `pnpm dev` (root and `apps/web`) runs SEO verification first
- `pnpm start` (`apps/web`) runs SEO verification first
- if SEO contracts fail, app startup is blocked

## Commands

Run in `apps/web`:

- `pnpm run verify:jsonld`
- `pnpm run verify:seo`
- `pnpm run verify:seo:report`
- `pnpm run verify:seo:freshness-eeat`
- `pnpm run verify:seo:canonical`
- `pnpm run verify:seo:consistency`
- `pnpm run verify:seo:crawl-budget`
- `pnpm run verify:seo:links`
- `pnpm run verify:seo:programmatic`
- `pnpm run verify:seo:scaffold`
- `pnpm run verify:seo:scaffold:sync-staged`
- `pnpm run verify:seo:scaffold:staged`
- `pnpm run verify:seo:smoke`
- `pnpm run verify:seo:monitor`
- `pnpm run verify:seo:nightly`
- `pnpm run verify:seo:weekly`
- `pnpm run verify:seo:weekly:dry`
- `pnpm run seo:create-page -- --path "/example" --title "Example" --description "SEO-ready page scaffold"`
- `pnpm run seo:webmaster:status`
- `pnpm run seo:webmaster:record -- --gsc ok --bing ok --notes "checked coverage + rich results"`

Run from repo root:

- `pnpm run verify:jsonld`
- `pnpm run verify:seo`
- `pnpm run verify:seo:report`
- `pnpm run verify:seo:freshness-eeat`
- `pnpm run verify:seo:canonical`
- `pnpm run verify:seo:consistency`
- `pnpm run verify:seo:crawl-budget`
- `pnpm run verify:seo:links`
- `pnpm run verify:seo:programmatic`
- `pnpm run verify:seo:scaffold`
- `pnpm run verify:seo:scaffold:sync-staged`
- `pnpm run verify:seo:scaffold:staged`
- `pnpm run verify:seo:smoke`
- `pnpm run verify:seo:monitor`
- `pnpm run verify:seo:nightly`
- `pnpm run verify:seo:weekly`
- `pnpm run seo:webmaster:status`

## SEO Page Generator

Create any new App Router page with mandatory SEO fields pre-wired:

- metadata title + description
- canonical (`alternates.canonical`)
- social tags (`discoverSocialMeta`)
- JSON-LD (`WebPageJsonLd`)
- optional noindex flag for private/internal pages

Examples:

- `pnpm run seo:create-page -- --path "/roadmap" --title "Roadmap" --description "Product roadmap and updates."`
- `pnpm run seo:create-page -- --path "/internal/preview" --title "Preview" --description "Internal preview page." --noindex true`

## Scaffold Gate (CI Hard Stop)

`verify:seo:scaffold` checks every static `src/app/**/page.tsx` and fails if any page is missing core SEO scaffold:

- metadata export (`metadata` or `generateMetadata`)
- canonical signal (`alternates.canonical`)
- social signal (`discoverSocialMeta` or explicit `openGraph` + `twitter`)
- JSON-LD signal (`WebPageJsonLd` or inline ld+json)

`verify:seo:scaffold:staged` runs the same contract only for staged files (`git diff --cached`) and is wired into `.husky/pre-commit` for faster, actionable feedback.

`verify:seo:scaffold:sync-staged` runs before staged verification and auto-adds a staged file when:

- staged blob fails SEO scaffold contract
- working tree version of the same file already passes all scaffold checks

This removes false failures caused by stale git index state.

## Environment

- `SEO_SMOKE_BASE_URL` - base URL for runtime checks
- `SEO_SMOKE_TIMEOUT_MS` - request timeout for smoke script
- `SEO_SMOKE_CONCURRENCY` - concurrent route checks per batch (default 8)
- `INDEXNOW_BATCH_SIZE` - IndexNow URLs per batch (default 10000)
- `INDEXNOW_MAX_ATTEMPTS` - IndexNow retry attempts per batch (default 3)
- `INDEXNOW_RETRY_BASE_MS` - exponential backoff base in ms (default 750)
- `INDEXNOW_TIMEOUT_MS` - timeout for IndexNow API/sitemap fetches in API trigger (default 15000)
- `INDEXNOW_SITEMAP_TIMEOUT_MS` - timeout for sitemap parsing in CLI submit (default 15000)
- `INDEXNOW_SITEMAP_MAX_URLS` - max URLs parsed from sitemap/urlset expansion (default 50000)
- `INDEXNOW_SITEMAP_MAX_FILES` - max sitemap index files to expand in API trigger (default 50)
- `SITEMAP_CHUNK_SIZE` - URLs per sitemap chunk via `generateSitemaps` (default 5000)
- `SEO_REQUIRE_DYNAMIC_SITEMAP=true|false` - fail sitemap build when dynamic detail URL inventory is too low
- `SEO_DYNAMIC_SITEMAP_MIN_URLS` - minimum dynamic detail URLs required when strict mode is enabled (default 20)
- `SEO_WEBMASTER_MAX_AGE_DAYS` - stale threshold for external checks (default 14)
- `SEO_MONITOR_ALLOW_BASE_URL_CHANGE=true` - allow base URL drift in monitor snapshots
- `SEO_MONITOR_TIMEOUT_MS` - timeout per monitor request (default 15000)
- `SEO_MONITOR_STATIC_SAMPLE_LIMIT` - max static routes sampled from sitemap (default 12)
- `SEO_MONITOR_DETAIL_SAMPLE_LIMIT` - max detail/entity routes sampled from sitemap (default 18)
- `SEO_MONITOR_NOINDEX_SAMPLE_LIMIT` - max noindex policy routes included in monitor (default 6)
- `SEO_NIGHTLY_REQUIRE_MONITOR=true|false` - force monitor required/optional in nightly runner
- `SEO_NIGHTLY_REQUIRE_SMOKE=true|false` - force smoke required/optional in nightly runner
- `SEO_WEEKLY_WARN_BUDGET` - max weekly warn findings before fail (default 2)
- `SEO_WEEKLY_MAX_DUPLICATE_TITLES` - allowed duplicate title count in monitor sample (default 0)
- `SEO_WEEKLY_MAX_MISSING_CANONICAL` - allowed missing canonical count in monitor sample (default 0)
- `SEO_WEEKLY_MAX_MISSING_JSONLD` - allowed missing JSON-LD count in monitor sample (default 0)
- `SEO_WEEKLY_MIN_STATIC_COVERAGE` - minimum static pages sampled in monitor snapshot (default 5)
- `SEO_WEEKLY_MIN_DETAIL_COVERAGE` - minimum detail/entity pages sampled in monitor snapshot (default 5)
- `SEO_WEEKLY_MIN_NOINDEX_COVERAGE` - minimum noindex routes sampled in monitor snapshot (default 3)
- `SEO_WEEKLY_MAX_WEBMASTER_AGE_DAYS` - max allowed age of external GSC/Bing evidence in weekly audit (default 7)

Policy source of truth for route governance:

- `scripts/seo-route-policy.json` (robots disallow, noindex routes, sitemap include/exclude contracts)

Internal link governance:

- `verify:seo:links` ensures each required static indexable route has at least one inbound internal link from app/components sources.
- This blocks orphan hub/static pages that can slow discovery and indexing.

Canonical governance:

- `verify:seo:canonical` enforces centralized canonical query builder usage in discover copy modules.
- Prevents drift in query parameter ordering/format across movies, series, cartoons, and TV shows hubs.

Freshness + E-E-A-T governance:

- `verify:seo:freshness-eeat` enforces freshness and trust fields in `jsonLdSite.ts` and root `layout.tsx`.
- Ensures publisher/contact identity and `dateModified` signals stay consistently wired.

Cross-contract consistency:

- `verify:seo:consistency` validates alignment across `seo-route-policy.json`, `robots.ts`, `sitemap.ts`, and page-level noindex/canonical metadata.
- Detects contradictions like required+forbidden overlap, noindex routes missing robots disallow, or indexable required routes accidentally marked noindex.

Crawl budget governance:

- `verify:seo:crawl-budget` enforces:
- required static indexable routes reachable from `/` within depth budget (`SEO_MAX_STATIC_ROUTE_DEPTH`, default 3)
- no high-cardinality internal faceted links (multiple query keys on `/movies|/series|/cartoons|/tvshows`)
- only approved faceted query keys appear in internal links

Programmatic SEO governance (Stage 3):

- `verify:seo:programmatic` validates `scripts/seo-programmatic-policy.json` as a hard quality gate.
- Required intent templates are fixed: `genre-year`, `genre-country`, `genre-rating`, `genre-mood`, `genre-franchise`, `actor-genre`, `director-genre`.
- Generation must be blocked for weak combinations: insufficient card volume, near-duplicate templates/content, no measurable search demand, or no unique user value.
- Each candidate page must pass quality thresholds (`minCards`, unique copy minimum, intent score, neighbor similarity cap, duplicate check).
- Weak pages follow strict indexing policy: **skip generation**, or **noindex**, or **internal-only** navigation.
- Thresholds (`minIntentScore`, `maxNeighborContentSimilarity`) are calibration-controlled and must be revalidated on a recurring cadence using Search Console/indexation evidence, not fixed permanently.

Machine-readable reports:

- `verify:seo:report` writes JSON artifacts to `.seo/reports/latest.json` and a timestamped file.
- `verify:seo` runs **`verify:seo:quick`** (subset: contracts, JSON-LD, infra, noindex, sitemap, canonical). **`verify:seo:full`** runs the complete orchestrated suite.
- CI can parse these artifacts directly for alerting/dashboards.

Nightly automation + alerts:

- `verify:seo:nightly` writes `.seo/reports/nightly-latest.json` and timestamped nightly reports.
- It runs **`verify:seo:full`** always, plus `verify:seo:monitor` / `verify:seo:smoke` as required checks in CI.
- On required-check failure it prints a `SEO NIGHTLY ALERT` block and exits non-zero.

Weekly audit + quality gate:

- `verify:seo:weekly` runs the final quality gate for pSEO operations:
- Required fail checks: `verify:seo:full`, `verify:seo:monitor`.
- Warn checks: `verify:seo:smoke`, `seo:webmaster:status`.
- Signal checks from `.seo/monitor-snapshot.json`: duplicate titles, missing canonical, missing JSON-LD, and route coverage thresholds.
- If `warn` findings exceed `SEO_WEEKLY_WARN_BUDGET`, weekly audit exits non-zero.
- Machine-readable artifacts are written to `.seo/reports/weekly-latest.json` and timestamped `weekly-*.json`.

Recommended weekly cadence:

1. Run `pnpm run verify:seo:weekly` in `apps/web`.
2. Review `weekly-latest.json` and identify:
   - indexability/canonical regressions;
   - duplicate/snippet quality regressions;
   - crawl coverage gaps;
   - stale external validation evidence.
3. In Search Console + Bing, review:
   - index coverage changes;
   - CTR outliers (high impressions, low CTR);
   - pages with weak/no internal link support;
   - pages to merge, noindex, or prune.
4. Record evidence: `pnpm run seo:webmaster:record -- --gsc ok --bing ok --notes "weekly audit + actions"`.

## External Validation Loop

At least every 14 days (or release cycle):

1. Review Google Search Console:
   - Pages indexing
   - Enhancements / rich results
   - Crawl stats anomalies
2. Review Bing Webmaster:
   - Index coverage
   - Crawl errors
   - Search performance
3. Record completion:
   - `pnpm run seo:webmaster:record -- --gsc ok --bing ok --notes "..."`.

This keeps SEO governance active across **all pages**, not only code-level checks.

## Entity URL canon (Level 1)

- **One TV work, one path:** All TMDB TV detail pages use **`/series/{slug}-{year}`** (or `/series/{slug}`). Discover slices `/tvshows` and `/series` are separate **hubs**; legacy **`/tvshow/[id]`** and **`/tvshows/[id]`** respond with a **permanent redirect** to the `/series/…` canonical URL.
- **Internal links:** `MediaCard`, `HeroSection`, and collection rails use `detailPathForShelfItem()` from `src/lib/slug.ts` so the UI does not emit numeric-id paths that then 301/308 (saves crawl budget, matches `alternates.canonical` + sitemap).
- **Root URL:** The static sitemap’s homepage entry is **`${SITE_URL}/`** so `<loc>` matches the homepage canonical from `discoverPageAlternates('/')` / `absoluteUrl` (trailing slash on the origin; aligns with 2025–2026 best practice: one consistent URL in canonical + sitemap + internal links).

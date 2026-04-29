# SEO QA Runbook (Programmatic)

This runbook defines the operational quality gate for MegDB programmatic SEO.

## Scope

- Canonical correctness and indexability.
- Sitemap and schema consistency.
- Duplicate metadata control.
- Redirect/404/crawl-budget hygiene.
- Orphan and weak-page prevention.
- Weekly monitoring and pruning loop.

## Daily/CI Gates (hard fail)

Run in `apps/web`:

- `pnpm run verify:seo:quick` for fast local/startup gate.
- `pnpm run verify:seo:full` before release and in nightly.

Checks included in `verify:seo:full`:

- `verify:seo:contracts`
- `verify:jsonld`
- `verify:seo:infra`
- `verify:seo:noindex`
- `verify:seo:sitemap`
- `verify:seo:schema`
- `verify:seo:freshness-eeat`
- `verify:seo:canonical`
- `verify:seo:consistency`
- `verify:seo:crawl-budget`
- `verify:seo:links`
- `verify:seo:programmatic`
- `verify:seo:scaffold`

## Weekly Gate (fail/warn policy)

Run in `apps/web`:

- `pnpm run verify:seo:weekly`

Artifacts:

- `.seo/reports/weekly-latest.json`
- `.seo/reports/weekly-<timestamp>.json`

### Fail checks (must pass)

- `verify:seo:full`
- `verify:seo:monitor`
- Duplicate titles in monitor sample must be `<= SEO_WEEKLY_MAX_DUPLICATE_TITLES` (default `0`)
- Missing canonical in monitor sample must be `<= SEO_WEEKLY_MAX_MISSING_CANONICAL` (default `0`)
- Missing JSON-LD in monitor sample must be `<= SEO_WEEKLY_MAX_MISSING_JSONLD` (default `0`)
- Coverage floors:
  - static `>= SEO_WEEKLY_MIN_STATIC_COVERAGE` (default `5`)
  - detail `>= SEO_WEEKLY_MIN_DETAIL_COVERAGE` (default `5`)
  - noindex `>= SEO_WEEKLY_MIN_NOINDEX_COVERAGE` (default `3`)

### Warn checks (budgeted)

- `verify:seo:smoke`
- `seo:webmaster:status`
- Webmaster evidence age should be `<= SEO_WEEKLY_MAX_WEBMASTER_AGE_DAYS` (default `7`)

Warn budget:

- `SEO_WEEKLY_WARN_BUDGET` (default `2`)
- If warn findings exceed budget, weekly audit fails.

## Weekly Monitoring Loop (manual + external)

1. **Index coverage**
   - GSC: Pages report (`Indexed`, `Crawled - currently not indexed`, `Duplicate, Google chose different canonical`).
2. **Traffic and CTR**
   - GSC Performance: flag URLs with high impressions and low CTR.
3. **Internal links**
   - Validate orphan/weak-link routes from `verify:seo:links` and monitor coverage.
4. **Content depth**
   - Find thin templates/pages with low uniqueness or empty sections.
5. **Pruning decisions**
   - Merge duplicates, canonicalize overlaps, noindex weak pages, remove dead/empty templates.
6. **Record evidence**
   - `pnpm run seo:webmaster:record -- --gsc ok --bing ok --notes "weekly audit summary"`

## Suggested Thresholds

- Keep duplicate titles at zero in sampled monitor pages.
- Keep missing canonical/JSON-LD at zero.
- Keep route coverage stable or increasing week-to-week.
- Prune/noindex URLs with persistent low value and weak internal graph support.

## Escalation

If weekly gate fails:

1. Treat canonical/index/sitemap/schema regressions as P0.
2. Treat orphan/thin-page spikes as P1.
3. Fix and rerun `pnpm run verify:seo:weekly`.
4. Only then proceed with new programmatic URL generation.

# Runtime, ISR, and cache map — MegDB web

Single reference for how responses are produced in `apps/web`. **Source of numeric policy:** `src/lib/cachePolicy.ts` (import `ROUTE_REVALIDATE_*` / `FETCH_REVALIDATE_*`).

## Route segment `revalidate` (ISR / dynamic)

`cachePolicy.ts` names the SLA; each `page.tsx` / `sitemap.ts` must use a **numeric literal** for `export const revalidate` (Next.js 15+ build cannot analyze imported identifiers). Mark each with `/** @sync \`ROUTE_…\` in @/lib/cachePolicy */` above the literal.

| Policy constant (`cachePolicy.ts`) | Seconds (literal) | Use |
|------------------------------------|------------------|-----|
| `ROUTE_REVALIDATE_SEARCH_DYNAMIC` | `0` | `/search` — always dynamic. |
| `ROUTE_REVALIDATE_DISCOVER_HUB` | `600` | Movie / series / TV / cartoon discover hubs. |
| `ROUTE_REVALIDATE_HOME` | `900` | `/` — must be ≤ `FETCH_REVALIDATE_FAST` for homepage shelves. |
| `ROUTE_REVALIDATE_MEDIA_DETAIL` | `3600` | Media detail, person, trailer, TV detail segments, API TV season fetches. |
| `ROUTE_REVALIDATE_SITEMAP` | `3600` | `sitemap.ts`. |
| `ROUTE_REVALIDATE_STATIC_COPY` | `86_400` | Legal / about / help / contact / settings-style pages. |

## `fetch` Data Cache tiers (TMDB)

| Constant | Seconds | Typical use |
|----------|--------|-------------|
| `FETCH_REVALIDATE_RANDOM_MOVIE` | 300 | `/api/random-movie` — short TTL, rate-limited. |
| `FETCH_REVALIDATE_FAST` | 900 | Trending, hero, new releases. |
| `FETCH_REVALIDATE_MODERATE` | 1800 | Acclaimed, best-of-year, detail shell. |
| `FETCH_REVALIDATE_DEFAULT` / `FETCH_REVALIDATE_PEOPLE` | 3600 | Default detail enrichment, people lists. |
| `FETCH_REVALIDATE_ALL_TIME` | 86_400 | All-time / top-rated rails. |

**Rule:** page-level `revalidate` must be **≤** the **fastest** `fetch` `revalidate` used on that route so the segment re-executes before stale Data Cache wins.

## Runtime (Node vs Edge)

| Area | Runtime | Notes |
|------|---------|--------|
| Most `app/**/page.tsx` | Node (default) | ISR supported. |
| `opengraph-image` | `edge` | `revalidate` not on edge segments per Next.js. |
| `app/api/seo/indexnow/*`, `indexnow-key` | `nodejs` | Node APIs. |

## CDN / static headers

- Global security/transport: `next.config.ts` `headers()`.
- Long cache for `/_next/static` is **platform default** (e.g. Vercel); no `vercel.json` in repo by design unless headers must override host defaults.

## CWV (architecture)

- LCP: preconnect + LCP preload components + `next/image` (AVIF/WebP). Changes to hero or critical images require **template-level** check against LCP budget.
- INP: client surface in `layout` and Framer-heavy islands — see roadmap (lazy boundaries, not one-off fixes).
- TTFB (detail): `getMoviePageData` runs **collection** enrichment and **similar** (discover + enrich) in parallel after the first TMDB payload; `getTvPageData` runs **similar** and **`tvRuntimeWithEpisodeFallback`** in parallel. Same `MoviePageDetail` shape and cache tags — strictly a latency merge.
- **Media detail streaming:** `/movie/[id]`, **`/cartoon/[id]`** (same movie shell + `MovieDetailStreamedBelowFold` `variant="movie"`), and **`/series/[id]`** / **`/tvshow(s)/[id]`** via **`getTvPageDataShell`** + **`getTvPageDataTailTv`** (`variant="tv"`). Metadata + hero use shell; gallery / similar / (movie) collection rails stream in `<Suspense>`. **`getMoviePageData` / `getTvPageData`** still merge shell+tail for API-style callers (e.g. cartoon route cache consumers, trailer metadata reuse).
- **`/person/[id]`:** profile shell first; **`PersonFilmographyStream`** loads credits inside `<Suspense>` (`getPersonCreditsCached`). **`/trailer/[id]`** uses **`getMoviePageDataShellCached`** only (trailer key is on the shell).

## Streaming (level-2)

- `/`: hero + `getHeroItems()` in the shell; discover shelves in `HomeDiscoverShelves` behind `<Suspense>`. `HomeLcpPreloadLinks` uses `shelfFallbacks={[]}` so streamed shelves do not block hero preload (rare empty-hero case may lose shelf poster preload until stream).
- Root chrome: `DeferredAppChrome` — `Ripple`, `ScrollProgressBar`, `BackToTop` via `next/dynamic` + `ssr: false` to trim initial main-thread work.

## SEO verify (`verify-seo-report.mjs`)

- **`pnpm run verify:seo`** (web and monorepo root) runs **`verify:seo:quick`** — contracts, JSON-LD, infra, noindex, sitemap, canonical only. Used on `predev`, `build`, `test`, `start` for fast feedback.
- **`pnpm run verify:seo:full`** runs the full report (adds schema, freshness/E-E-A-T, consistency, crawl budget, internal links, scaffold). Use locally before release or in CI/nightly (`verify:seo:nightly` already invokes full).

## Related

- ADR: `docs/adr/0001-data-plane-serving.md`
- TMDB types re-export: `src/lib/tmdb.ts` (fetch tiers re-exported as `TMDB_REVALIDATE_*`).

/**
 * Single source of truth for MegDB cache / ISR policy (web app).
 *
 * **Route segment `revalidate` (critical):** Next.js must see a **numeric literal** in
 * `page.tsx` / `sitemap.ts` (e.g. `export const revalidate = 900`). Do **not** use imported
 * names for `revalidate` — the build will fail (invalid page config). Duplicate the value
 * here and in each route, and keep the pair in sync; see `ARCH-ROUTING.md`.
 *
 * **fetch() Data Cache** — use `FETCH_REVALIDATE_*` (and `ROUTE_*` in API routes / shared
 * lib) in `tmdb.ts`, `route.ts`, and non-segment code. Route-level `revalidate` should be ≤
 * the fastest `fetch` tier used on that page.
 *
 * **Cache tags** — use `CACHE_TAG_*` constants in `tmdbFetch` `tags` option and in
 * `/api/revalidate` to enable on-demand invalidation via `revalidateTag`.
 */
export const ROUTE_REVALIDATE_SEARCH_DYNAMIC = 0

export const ROUTE_REVALIDATE_DISCOVER_HUB = 600

/** Home: 15m — must be ≤ fastest shelf tier on the homepage (`FETCH_REVALIDATE_FAST`). */
export const ROUTE_REVALIDATE_HOME = 900

/** Media detail, person, trailer, sitemap, random-movie page — 1h cadence. */
export const ROUTE_REVALIDATE_MEDIA_DETAIL = 3600

export const ROUTE_REVALIDATE_SITEMAP = 3600

/** Legal / static copy — 24h. */
export const ROUTE_REVALIDATE_STATIC_COPY = 86_400

// ── fetch() Data Cache tiers (TMDB + auxiliary APIs) ─────────────────────────

export const FETCH_REVALIDATE_DEFAULT = 3600

/** 15m — hero, trending, new releases, fast discover rails. */
export const FETCH_REVALIDATE_FAST = 900

/** 30m — best-of year, acclaimed, enrich passes. */
export const FETCH_REVALIDATE_MODERATE = 1800

/** 1h — people, popular actors, person credits. */
export const FETCH_REVALIDATE_PEOPLE = 3600

/** 24h — top-rated / all-time lists. */
export const FETCH_REVALIDATE_ALL_TIME = 86_400

/**
 * 24h — genre names + runtime from detail enrichment endpoints.
 * These fields are stable (genre taxonomy rarely changes; runtime is set at release).
 * Using 24h means cold-cache enrichment runs at most once per day per item,
 * cutting TMDB API calls on homepage revalidation cycles by ~8×.
 */
export const FETCH_REVALIDATE_ENRICHMENT = 86_400

/** `GET /api/random-movie` — short TTL for variety without hammering TMDB. */
export const FETCH_REVALIDATE_RANDOM_MOVIE = 300

// ── Cache tags for on-demand revalidation via revalidateTag ──────────────────
//
// Usage in tmdbFetch: { next: { revalidate: N, tags: [CACHE_TAG_TRENDING] } }
// Usage in /api/revalidate: revalidateTag(CACHE_TAG_TRENDING)
//
// Tag granularity:
//   - Coarse tags (tmdb-trending, tmdb-home) → invalidate whole homepage shelf group
//   - Fine tags (tmdb-movie-{id}) → invalidate a single detail page
//
// Call POST /api/revalidate?secret=<REVALIDATE_SECRET>&tag=<tag> to purge on-demand.

/** All trending / fast-refresh homepage shelves (trending, new releases, hero). */
export const CACHE_TAG_TRENDING = 'tmdb-trending'

/** Homepage shelves that refresh on moderate cadence (best-of-year, acclaimed). */
export const CACHE_TAG_HOME_MODERATE = 'tmdb-home-moderate'

/** All-time lists — top-rated movies and series. */
export const CACHE_TAG_ALL_TIME = 'tmdb-all-time'

/** Popular actors shelf. */
export const CACHE_TAG_PEOPLE = 'tmdb-people'

/** Movie discover hub and browse results. */
export const CACHE_TAG_DISCOVER_MOVIES = 'tmdb-discover-movies'
/** Compatibility alias for Next.js caching examples / external webhooks. */
export const CACHE_TAG_MOVIES = 'movies'

/** Series / TV discover hub and browse results. */
export const CACHE_TAG_DISCOVER_TV = 'tmdb-discover-tv'

/**
 * Per-movie detail tag. Use `cacheTagMovie(id)` to generate.
 * Invalidating this tag purges only that movie's detail page data.
 */
export function cacheTagMovie(id: number): string {
  return `tmdb-movie-${id}`
}

/**
 * Per-TV detail tag. Use `cacheTagTv(id)` to generate.
 */
export function cacheTagTv(id: number): string {
  return `tmdb-tv-${id}`
}

/**
 * Per-person detail tag.
 */
export function cacheTagPerson(id: number): string {
  return `tmdb-person-${id}`
}

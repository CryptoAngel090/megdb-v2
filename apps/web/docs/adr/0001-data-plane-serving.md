# ADR 0001: Serving layer vs TMDB (data plane)

**Status:** Accepted (directional)  
**Date:** 2026-04-25

## Context

The public read path is built on **TMDB** via `fetch` and the **Next.js Data Cache**, with **ISR** at the route level (`cachePolicy.ts`). High-cardinality routes (`/movie/[id]`, etc.) cannot rely on “smarter” invalidation than time-based revalidation until a **serving** layer exists.

## Decision

1. **Ingestion** (future): sync jobs or webhooks from TMDB → normalized store and/or **Typesense** / DB.
2. **Serving** (target): RSC and route handlers read from **our** snapshots/index with **`revalidateTag`** (or path invalidation) where ownership of data allows it.
3. **Until then:** all numeric policies live in **`src/lib/cachePolicy.ts`**; TMDB remains the upstream for HTML, but the **policies** for freshness are centralized to avoid magic numbers in routes.
4. **No big-bang** swap of the render path without a **vertical slice** (one media type or one surface, e.g. search-only via Typesense) and measurable SLOs.

## Consequences

- Positive: one place to change SLAs; easier migration to tag-based revalidation.
- Risk: two sources of truth during migration; requires feature flags and backfill discipline.

## Supersedes

Nothing. Supersedes **ad hoc** per-file `revalidate` literals in `app/`.

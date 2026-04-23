# ARCHITECTURE.md — MegDB map

Keep this file aligned with the real stack as the repo evolves.

## Stack (current direction)

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** CSS Modules + shared CSS variables (`apps/web/src/styles/globals.css`, `packages/ui`)
- **Backend:** Hono + tRPC on Bun (`apps/api`)
- **Database:** PostgreSQL via Drizzle (`packages/db`) — Neon in production is typical
- **Cache:** in-memory / Redis (Upstash) — as implemented per route
- **External data:** TMDB API for catalogue metadata
- **Deploy:** Vercel (web/admin) + Railway or similar for API — target, not mandatory locally

## Domains (product)

Movies, series, people, search, auth, users, watchlists, reviews — implemented incrementally; not every route exists yet.

## Rendering and cache

- Home and static-ish sections: `revalidate` where set in `page.tsx` / `layout.tsx`.
- Search and personalized views: prefer `no-store` or client fetch when user-specific.
- Any mutation must document what to revalidate (path/tag strategy).

## Trust boundaries

Browser ↔ Next.js ↔ API ↔ Redis/DB ↔ TMDB.  
Never leak secrets to client components; never trust client-only checks for auth.

## Observability (target)

Request/trace IDs across services; alert on 5xx spikes, dependency failures, and auth refresh errors.

## Data flow (simplified)

User action → React (Server or Client Component) → fetch / Server Action → API route or tRPC → service → DB / cache → JSON → UI.

## Known tech debt

Track concrete items in `LESSONS.md` and GitHub issues.

---

_MegDB — architecture notes (English only)._

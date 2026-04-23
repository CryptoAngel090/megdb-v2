# Handoff — MegDB (quick context)

Single file to resume fast in a new session. Details live in code and commits.

## Tooling and quality

- **ESLint 9 (flat config):** root `eslint.config.mjs`; Next apps use `apps/web/eslint.config.mjs`, `apps/admin/eslint.config.mjs`.
- **Lint:** `eslint .` in app packages; Next build may skip ESLint — run `pnpm lint` separately.
- **Bun API typings:** `apps/api/tsconfig.json` uses `"types": ["bun"]`.
- **Tests:** Vitest at repo root; `apps/web` and `apps/api` expose `test` scripts and smoke tests.
- **From repo root:** `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`.

## Search and types (web)

- **`apps/web/src/app/api/search/route.ts`:** TMDB response parsed with type guards; **rate limit** per IP (~45/min, in-memory), **429** + `Retry-After`; on failure SearchBar clears results.
- **`apps/web/src/components/SearchBar/SearchBar.tsx`:** safe JSON parsing, strict ESLint–friendly code.
- **`apps/web/src/lib/rateLimit.ts`:** sliding window counter; use Redis/Upstash if you run multiple server instances.
- **`apps/web/.env.example`:** template for `TMDB_API_KEY`.
- **`apps/web/src/lib/tmdb.ts`:** TMDB data for home shelves and hero.

## Errors and 404 (web)

- **`apps/web/src/app/error.tsx`:** client boundary — “Something went wrong”, **Try again** (`reset`), link **Home**.
- **`apps/web/src/app/not-found.tsx`:** 404 with link home.

## Header and drawer (`Header`)

File: `apps/web/src/components/Header/Header.tsx` (+ `Header.module.css`).

Implemented:

- **Drawer:** focus trap, `Esc`, body scroll lock, focus restore.
- **User menu (desktop):** closes on `Esc` and outside click.
- **Nav:** `aria-current="page"` where appropriate.
- **Notifications (desktop):** link to `/notifications` instead of a dead button.
- **Search in drawer:** debounced `/api/search`, keyboard navigation, empty state **Nothing found**.
- **Auth UI stub:** `isLoggedIn` follows cookie hints (`session` / `auth` / `token`) until a real auth layer ships.

## Hero

- **`getHeroItems()`** in `tmdb.ts` — current-year theatrical releases with backdrop; empty list hides the hero (no throw).
- **Hero carousel UI + homepage shelves (New This Week, Coming in 2026, badges, TMDB filters):** see root **`HOMEPAGE-MEDIA-SESSION.md`**.

## Monorepo

- **`apps/admin`**, **`apps/api`**, **`packages/db`** — not fully audited in every session; review when wiring product features.

## Dev commands

- **Root:** `pnpm dev` — runs Turbo dev for scoped packages (ports per package scripts, e.g. web often `:3000`).

## Intentionally not done here

- Full Better-Auth / session backend — UI prep and cookie heuristics only.
- Playwright E2E for drawer — unit tests for search utils exist.

_MegDB — internal handoff notes._

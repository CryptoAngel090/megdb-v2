# CLAUDE.md — MegDB (2026)

@PROGRESS.md

---

## Session start

- Read `PROGRESS.md` for where we left off and what is next.
- Do not open files that are not needed for the current task.
- After loading context, reply: `Context loaded. Last step: [X]. Next: [Y].`

---

## Stack (target / planned)

```
Monorepo:     Turborepo + pnpm workspaces
Runtime:      Bun (API)
Frontend:     Next.js 15 (App Router) + React 19 + TypeScript (strict)
Backend:      Hono + tRPC + Bun
DB:           Neon PostgreSQL + pgvector
ORM:          Drizzle
Search:       Typesense (self-hosted) — planned
Cache:        Upstash Redis — planned
Media:        Cloudflare Images / Stream — planned
CDN/WAF:      Cloudflare — planned
Auth:         Better-Auth — planned
Jobs:         Trigger.dev (TMDB sync) — planned
Email:        Resend — planned
Monitoring:   Sentry + PostHog — planned
Deploy:       Vercel (web + admin) + Railway (api) — planned
Tests:        Vitest (+ Playwright — planned)
Motion:       Framer Motion
```

---

## Monorepo layout

```
root/
├── apps/
│   ├── web/          ← public site (Next.js)
│   ├── api/          ← Hono + tRPC + Bun
│   └── admin/        ← admin dashboard (Next.js)
└── packages/
    ├── ui/           ← shared design system (tokens + components)
    ├── db/           ← Drizzle schema + migrations
    └── types/        ← shared TypeScript types
```

---

## Component folder convention

**One feature folder = three files (where animations are used):**

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
└── ComponentName.animations.ts
```

**Do not:**

- Put styles inside `.tsx` (no inline styles, no CSS-in-JS).
- Put motion variants inline in `.tsx` (import from `.animations.ts` instead).
- Put more than one exported UI component in a single `.tsx` file.
- Let a single file grow past ~150 lines without splitting.

---

## Mobile-first

Base styles at ~375px, then widen with `@media (min-width: …)`.

Breakpoints in this project: **375 / 768 / 1024 / 1280 / 1536**  
Touch targets: at least **44×44px**  
Page edge padding: at least **16px** on small screens

---

## Animations

- Duration: roughly 150–300ms.
- Every motion should clarify an action, not decorate blindly.
- Respect `prefers-reduced-motion` (disable non-essential motion).
- Avoid pointless autoplay loops and absurd `z-index` stacks.

---

## Design tokens

MegDB uses CSS variables (see `apps/web/src/styles/globals.css` and `packages/ui/src/tokens/`). Prefer tokens over raw hex in components.

---

## SEO (when you add pages)

- Use Next.js `metadata` / `generateMetadata` per route.
- Keep titles and descriptions unique per URL.
- Add structured data (JSON-LD) where it matches the content.

---

## Code rules (MegDB)

**TypeScript**

- Avoid `any` and `@ts-ignore`.
- Prefer `interface` for public component props.
- In Next.js 15+, `params` and `searchParams` are async — `await` them.

**Next.js**

- Server Components by default.
- Mark files `'use client'` only when you need hooks, events, or browser-only APIs.
- Wrap `useSearchParams()` usage in `<Suspense>` where required.

**Styling**

- CSS Modules + shared tokens — no random magic numbers outside the spacing scale.

**Imports**

- Prefer `@/` aliases over deep `../../` chains.

---

## Task scope

- Touch only files that the task names.
- Avoid drive-by refactors or “while I’m here” changes.
- If the task is ambiguous, ask one clarifying question instead of guessing.

---

## Startup reply format

`Status: [what was loaded]. Last step: [X]. Next: [Y].`

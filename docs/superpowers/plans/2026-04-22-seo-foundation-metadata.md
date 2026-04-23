# SEO Foundation Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the highest-impact SEO foundation gaps in MegDB by adding stable site metadata assets, verification hooks, and structured data entry points.

**Architecture:** Implement foundational SEO at the App Router root (`apps/web/src/app`) so all routes inherit consistent metadata behavior. Add file-based metadata assets and one reusable JSON-LD helper for home-page search semantics.

**Tech Stack:** Next.js 15 App Router, TypeScript, metadata API, JSON-LD script injection

---

### Task 1: Add App Icon And Manifest Assets

**Files:**

- Create: `apps/web/src/app/icon.png`
- Create: `apps/web/src/app/favicon.ico`
- Create: `apps/web/src/app/apple-icon.png`
- Create: `apps/web/src/app/manifest.ts`
- Test: `apps/web/src/app/manifest.ts` (manual verification through browser and page source)

- [ ] **Step 1: Add failing validation checklist entry (local)**

Create a temporary note in your working scratchpad (not committed) listing:

- favicon missing
- apple-touch icon missing
- manifest missing

Expected: Current project fails all three checks.

- [ ] **Step 2: Add file-based metadata assets**

Place production-ready icon files into:

- `apps/web/src/app/icon.png`
- `apps/web/src/app/favicon.ico`
- `apps/web/src/app/apple-icon.png`

Expected: Files are present in git status and can be resolved by Next.js metadata conventions.

- [ ] **Step 3: Implement manifest route**

Add `apps/web/src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MegDB',
    short_name: 'MegDB',
    description: 'MegDB movie and series discovery catalog.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1020',
    theme_color: '#0b1020',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
```

- [ ] **Step 4: Verify manifest and icons resolve**

Run: `pnpm --filter web dev`
Expected:

- `/manifest.webmanifest` returns 200
- Browser tab shows custom favicon
- `apple-touch-icon` is visible in rendered `<head>`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/icon.png apps/web/src/app/favicon.ico apps/web/src/app/apple-icon.png apps/web/src/app/manifest.ts
git commit -m "feat(web): add foundational app icons and web manifest metadata"
```

### Task 2: Normalize Root Viewport And Verification Metadata

**Files:**

- Modify: `apps/web/src/app/layout.tsx`
- Test: `apps/web/src/app/layout.tsx` (metadata render verification)

- [ ] **Step 1: Write failing test case expectations**

Define expected root metadata behavior:

- explicit viewport object exported
- `metadata.verification.google` is read from env

Expected: Current layout does not satisfy both conditions simultaneously.

- [ ] **Step 2: Add viewport export in root layout**

Update `apps/web/src/app/layout.tsx` with:

```ts
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}
```

- [ ] **Step 3: Add verification metadata hook**

Extend `metadata` in `apps/web/src/app/layout.tsx`:

```ts
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  // existing metadata fields...
  verification: googleSiteVerification ? { google: googleSiteVerification } : undefined,
}
```

- [ ] **Step 4: Verify rendered metadata output**

Run: `pnpm --filter web dev`
Expected:

- `<meta name="viewport" content="width=device-width, initial-scale=1">` exists
- when env is set, `<meta name="google-site-verification" ...>` exists
- no TypeScript errors in `layout.tsx`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(web): add explicit viewport and google verification metadata"
```

### Task 3: Add WebSite + SearchAction JSON-LD On Home Route

**Files:**

- Create: `apps/web/src/lib/seo/jsonLd.ts`
- Modify: `apps/web/src/app/page.tsx`
- Test: `apps/web/src/app/page.tsx` (JSON-LD presence and shape)

- [ ] **Step 1: Write failing behavior expectation**

Target requirement:

- home route emits one `WebSite` JSON-LD block
- includes `SearchAction` target `.../search?q={search_term_string}`

Expected: Current home page is missing this structured data block.

- [ ] **Step 2: Implement JSON-LD builder utility**

Create `apps/web/src/lib/seo/jsonLd.ts`:

```ts
export interface WebsiteJsonLdInput {
  siteName: string
  siteUrl: string
}

export function buildWebsiteJsonLd(input: WebsiteJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.siteName,
    url: input.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${input.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
```

- [ ] **Step 3: Inject script on home page**

Update `apps/web/src/app/page.tsx`:

```tsx
import { buildWebsiteJsonLd } from '@/lib/seo/jsonLd'

const websiteJsonLd = buildWebsiteJsonLd({
  siteName: 'MegDB',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://megdb.app',
})

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
/>
```

- [ ] **Step 4: Verify structured data output**

Run: `pnpm --filter web dev`
Expected:

- home HTML includes one `application/ld+json` script with `WebSite`
- structured data includes `potentialAction` and `SearchAction`
- no duplicate script blocks

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/seo/jsonLd.ts apps/web/src/app/page.tsx
git commit -m "feat(web): add website searchaction structured data on homepage"
```

### Task 4: Optional Middleware Canonicalization Gate

**Files:**

- Create: `apps/web/src/middleware.ts` (if canonical redirect is not already handled at CDN)
- Test: `apps/web/src/middleware.ts` (redirect behavior for host/protocol normalization)

- [ ] **Step 1: Confirm infrastructure ownership**

Check whether Cloudflare already enforces:

- `http -> https`
- `www -> apex` (or inverse)

Expected: One owner only (CDN or app middleware), no duplication.

- [ ] **Step 2: Add minimal middleware only if needed**

If CDN is not enforcing redirects, create `apps/web/src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get('host') ?? ''

  if (host.startsWith('www.')) {
    url.host = host.replace(/^www\./, '')
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}
```

- [ ] **Step 3: Verify redirect behavior**

Run: `pnpm --filter web dev`
Expected:

- requests to `www` host produce 308 redirect to canonical host
- no redirect loop

- [ ] **Step 4: Verify unaffected internal routes**

Run: `pnpm --filter web test` (or route smoke checks if tests are unavailable)
Expected: app routes still resolve as before.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat(web): enforce canonical host redirect in middleware"
```

---

## Self-Review Checklist (Completed)

- Spec coverage: this plan maps directly to checklist gaps 15.1, 15.2, 15.4, 15.5 and conditional 15.3.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: `Metadata`, `Viewport`, and JSON-LD helper signatures are explicit and consistent.

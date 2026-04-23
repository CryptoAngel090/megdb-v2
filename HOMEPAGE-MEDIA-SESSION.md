# Homepage, hero, and media shelves — implementation notes

Single reference for changes discussed in session (MegDB / `apps/web`). Code is the source of truth; this file summarizes behavior and touched files.

---

## 1. Hero carousel — slide progress strip

**Goal:** Red countdown/progress line spans the **full width** of the hero, sits on the **bottom edge** of the hero section; pause + dots stay **above** the line.

**Structure (`HeroSection.tsx`):**

- Removed wrapper `carouselDock`.
- Two siblings inside `<section className={styles.hero}>`:
  - `carouselControls` — pause + indicators.
  - `slideProgressTrack` — full-width bar with animated `slideProgressFill`.

**Styles (`HeroSection.module.css`):**

- `.slideProgressTrack`: `position: absolute; bottom: 0; left: 0; right: 0; width: 100%`; no short centered pill width cap.
- `.carouselControls`: `position: absolute; bottom: ~18px` (mobile `~14px`) so controls sit above the strip.

**Files:** `apps/web/src/components/HeroSection/HeroSection.tsx`, `HeroSection.module.css`.

---

## 2. “New This Week” — movies & series only (fiction-first)

**Data:** `getNewReleases()` in `apps/web/src/lib/tmdb.ts`.

**Behavior:**

- Still merges `/discover/movie` + `/discover/tv` in a date window (last ~14 days → today).
- TV uses **`with_type: '2|4'`** (miniseries + scripted), not talk/news/reality-only types.
- **Genre guard:** `passesShelfGenreFilter` / `SHELF_EXCLUDED_GENRE_IDS` aligned with `without_genres` (`SHELF_EXCLUDE`).
- **Movies:** drop TMDB genre **10770** (“TV Movie”) via `isNewThisWeekMovie`.
- **Combat / wrestling PPV-style rows** (often stored as “movie” with Action/Drama): **`isCombatSportsOrWrestlingProgram`** matches title/name/original titles/overview against `COMBAT_SPORTS_PROGRAM_RE` (WWE, WrestleMania, AEW, UFC numbered events, etc.).
- **`TmdbRawMedia`** extended with optional `original_title`, `original_name` for those checks.

**Home:** `MediaShelf title="New This Week"` with `items={newReleases}` — `page.tsx`.

---

## 3. “Coming in 2026” — order, dates, poster badge

### Sorting (soonest first)

**`getComingIn2026()`:**

- Discover movie: `sort_by: primary_release_date.asc`; date range today → end of 2026.
- Discover TV: `sort_by: first_air_date.asc`; same window; **`with_type: '2|4'`**.
- After merge: **sort by `releaseDate` ascending** (missing dates last). Then `slice(0, 20)`.
- Still requires `poster_path` on raw results before mapping.

### UI — full date as red badge on poster

**`page.tsx`:**

```tsx
<MediaShelf
  title="Coming in 2026"
  items={comingIn2026}
  viewAllHref="/movies?coming=2026"
  releaseDateDisplay="full"
/>
```

**`MediaShelf`:** optional prop `releaseDateDisplay?: 'year' | 'full'` passed to each `MediaCard` (omitted when undefined for `exactOptionalPropertyTypes`).

**`MediaCard`:**

- **`formatReleaseLabel` / `toLocalCalendarDate`:** `YYYY-MM-DD` parsed as **local calendar date** (avoids UTC off-by-one). `full` uses `Intl.DateTimeFormat('en-GB', { day, month: short, year })` → e.g. `15 May 2026`.
- **`releaseDateDisplay === 'full'`:**
  - **Badge on poster:** `.releaseDateBadge` — **centered** bottom (`left: 0; right: 0; margin-inline: auto; width: fit-content`), styling aligned with **genre pills**: black background, **red border** `rgba(229, 9, 20, 0.9)`, white text, pill radius.
  - **No** release line in the panel under the poster (only **runtime** there if present).
  - **No** date in hover overlay (year-only mode still shows year in overlay + under poster).

**Files:** `MediaCard.tsx`, `MediaCard.module.css`, `MediaShelf.tsx`, `page.tsx`, `tmdb.ts`.

---

## 4. File checklist

| Area            | Files                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Hero progress   | `HeroSection.tsx`, `HeroSection.module.css`                                               |
| Shelves data    | `apps/web/src/lib/tmdb.ts` (`getNewReleases`, `getComingIn2026`, helpers, `TmdbRawMedia`) |
| Cards / shelves | `MediaCard.tsx`, `MediaCard.module.css`, `MediaShelf.tsx`                                 |
| Home layout     | `apps/web/src/app/page.tsx`                                                               |

---

## 5. Verify

From `apps/web`:

```bash
pnpm exec tsc --noEmit
```

Visual: hero bar edge-to-edge; New This Week without obvious WWE/combat PPV rows; Coming in 2026 ordered soonest → later, red date badge centered on poster.

---

_MegDB — session implementation notes._

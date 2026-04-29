# MegDB SEO Stage 1 — Entities and Canonical URL Map

Updated: 2026-04-27

## Goal

Fix one stable URL policy for each entity type so "one meaning = one canonical URL".

## Global Canonical Rules

1. Canonical uses path segments only; query is non-canonical for entity pages.
2. Every entity has exactly one indexable primary URL format.
3. Query/path duplicates must 301 to the primary path URL.
4. Parameter order in faceted URLs is deterministic; only allowed filter keys are kept.
5. Pagination (`page`, `cursor`, infinite scroll state) is never canonicalized as a separate page.
6. Language/region mirrors must point to their own self-canonical if localized, otherwise to the global canonical URL.
7. Trailing slash policy is strict: canonical URLs have no trailing slash (except root `/`); slash variants 301 to canonical.
8. Case policy is strict: path segments are lowercase; uppercase variants 301 to lowercase canonical.

## Entity Page Types

| Entity type | Primary URL pattern | Slug rule | Indexing | Canonical target | Related entities |
| --- | --- | --- | --- | --- | --- |
| Genre | `/movies/genre/{genre-slug}` | Controlled dictionary slug (`action`, `drama`, `sci-fi`) | Index | Self | Films, series, collections |
| Movie | `/movie/{id}/{slug}` | `{slug}` = normalized title, `{id}` = TMDB id | Index | Self | Genre, year, country, language, franchise, collection, director, cast |
| Series | `/series/{id}/{slug}` | Same as movie (title slug + stable id) | Index | Self | Genre, year, country, language, franchise, collection, creator/cast |
| Person (actor/crew) | `/person/{id}/{slug}` | Human name slug + stable id | Index | Self | Movies, series, roles, credits |
| Director | `/director/{id}/{slug}` | Person slug + stable id (role-qualified page) | Index | Self | Movies, genres, years |
| Franchise | `/franchise/{id}/{franchise-slug}` | Slug + stable id (self-healing if slug changes) | Index | Self | Movies/series in franchise |
| Collection | `/collection/{id}/{collection-slug}` | Slug + stable id (self-healing if slug changes) | Index | Self | Movies/series grouped by theme |
| Year hub | `/movies/year/{yyyy}` | 4-digit year only (`1900..current+1`) | Index | Self | Movies, series, top genres by year |
| Country hub | `/country/{iso2}` | ISO-3166-1 alpha-2 lowercase (`us`, `gb`, `jp`) | Index | Self | Movies, series, language filters |
| Language hub | `/language/{iso639-1}` | ISO-639-1 lowercase (`en`, `es`, `fr`) | Index | Self | Movies, series, country intersections |
| Curated подборка (editorial) | `/collection/{id}/{collection-slug}` | Editorial slug + stable id, no runtime query state in URL | Index | Self | Movie/series cards, people |

## Stable ID Policy (Slug Drift Protection)

- All mutable-name entities must include stable id in canonical URL:
  - movie, series, person, director, franchise, collection
- Reason: slug can change (title rename, transliteration update, editorial cleanup), id cannot.
- Self-healing behavior:
  - Request to `/entity/{id}/{old-slug}` resolves entity by id and 301 redirects to `/entity/{id}/{current-slug}`.
- Slug-only URLs are not canonical for mutable entities and must redirect to id+slug canonical URL.
- Slug-only format is allowed only for controlled immutable hubs (genre/year/country/language dictionaries).

## Filter-Only Pages (Noindex)

These URLs exist for UX filtering but must not become index targets:

- Multi-filter combinations, for example:
  - `/movies?genre=action&year=2024`
  - `/movies/genre/action?country=us&language=en`
  - `/series?sort=rating&year=2023&country=jp`
- Sort/view toggles:
  - `sort`, `view`, `layout`, `perPage`, `cursor`, `page`, `utm_*`, `ref`
- Empty-result filter states.

Policy:

- `robots: noindex, follow`
- canonical points to nearest stable hub:
  - Prefer single-entity hub if one exists (`/movies/genre/action`)
  - Fallback to base discover hub (`/movies` or `/series`)

## Duplicate Resolution Matrix

| Duplicate case | Canonical strategy |
| --- | --- |
| Query entity URL (`/movies?genre=action`) vs path URL (`/movies/genre/action`) | 301 to path URL |
| Legacy path variants (`/tvshow/...`, `/tvshows/...`) vs canonical (`/series/...`) | 301 to `/series/...` |
| Slug drift for same id (`/movie/123/wrong-slug`) | 301 to `/movie/123/correct-slug` |
| Trailing slash, case, mixed encoding variants | Normalize and 301 to normalized lowercase canonical |
| Slug-only mutable URL (`/person/tom-hanks`) | 301 to `/person/{id}/tom-hanks` canonical |

## Slug Normalization Standard

- Lowercase
- Unicode normalized (NFKD), diacritics removed
- Spaces/underscores -> `-`
- Collapse duplicate hyphens
- Remove punctuation except hyphen
- Preserve stable id in URL for entities where title/name can change
- Reserved words blocked (`new`, `edit`, `api`, etc.) via suffix strategy (`-item`)

## Examples

- `/movies/genre/action`
- `/movies/year/2024`
- `/person/31/tom-hanks`
- `/franchise/948/fast-and-furious`
- `/collection/1102/oscar-winning`
- `/country/us`
- `/language/en`

## Sitemap and Internal Link Contracts

- Sitemap includes canonical URLs only (no query URLs, no redirects, no noindex pages).
- Every `<loc>` must match the same URL emitted in page canonical metadata.
- Internal links in app UI must point only to canonical URLs (do not link to query duplicates or legacy aliases).
- Legacy/alias URLs may exist for compatibility, but only as redirect targets and never as emitted links.

## Robots/Meta Indexing Policy

- Filter-only URLs: `noindex, follow`.
- Weak/thin placeholder pages (empty entity, stub profile, zero-value generated pages): `noindex, follow` until content quality threshold is met.
- Indexable hubs/entities must remain `index, follow` with self-canonical.

## Done Criteria for Stage 1

For any entity, it must be instantly clear:

1. Which URL is primary.
2. Which linked entities it belongs to.
3. Whether the page is index or noindex.
4. What exact canonical URL is emitted.


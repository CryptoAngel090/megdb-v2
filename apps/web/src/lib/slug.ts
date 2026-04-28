import type { MediaType } from '@repo/types'
import { searchMovies, searchTvShows } from './tmdb'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Canonical path: `/movie/title-year` (no numeric id). */
export function moviePath(title: string, releaseDate?: string | null): string {
  const slug = toSlug(title)
  if (!slug) return '/movies'
  const year = releaseDate && releaseDate.length >= 4 ? Number(releaseDate.slice(0, 4)) : null
  const y = year != null && Number.isFinite(year) ? year : null
  return y ? `/movie/${slug}-${y}` : `/movie/${slug}`
}

/** Canonical path: `/cartoon/title-year` (TMDB movie id; animation catalogue). */
export function cartoonPath(title: string, releaseDate?: string | null): string {
  const slug = toSlug(title)
  if (!slug) return '/cartoons'
  const year = releaseDate && releaseDate.length >= 4 ? Number(releaseDate.slice(0, 4)) : null
  const y = year != null && Number.isFinite(year) ? year : null
  return y ? `/cartoon/${slug}-${y}` : `/cartoon/${slug}`
}

/** Canonical path: `/series/title-year` (TMDB `first_air_date` year). */
export function seriesPath(title: string, firstAirDate?: string | null): string {
  const slug = toSlug(title)
  if (!slug) return '/series'
  const year = firstAirDate && firstAirDate.length >= 4 ? Number(firstAirDate.slice(0, 4)) : null
  const y = year != null && Number.isFinite(year) ? year : null
  return y ? `/series/${slug}-${y}` : `/series/${slug}`
}

export type DetailMediaKind = 'movie' | 'series' | 'tvshow' | 'cartoon'

export function detailPathForMedia(
  kind: DetailMediaKind,
  title: string,
  releaseOrFirstAir: string | null
): string {
  switch (kind) {
    case 'series':
      return seriesPath(title, releaseOrFirstAir)
    case 'tvshow':
      /* One canonical TV detail URL (`/series/…`). Legacy `/tvshow/[id]` and `/tvshows/[id]` 308/301 here. */
      return seriesPath(title, releaseOrFirstAir)
    case 'cartoon':
      return cartoonPath(title, releaseOrFirstAir)
    default:
      return moviePath(title, releaseOrFirstAir)
  }
}

/** Normalize shelf/release dates to `YYYY-MM-DD` (or `YYYY` prefix) for slug helpers. */
export function releaseDateToYmd(d: Date | string | null | undefined): string | null {
  if (d == null) return null
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  }
  const t = d.trim()
  if (t.length >= 10) return t.slice(0, 10)
  if (t.length >= 4) return t.slice(0, 4)
  return null
}

/**
 * Single entry for **internal** card links: title-year (or title) slugs, aligned with `discoverPageAlternates` / sitemap.
 * `MediaType` matches `DetailMediaKind` — `tvshow` and `series` both map to `/series/…`.
 */
export function detailPathForShelfItem(item: {
  type: MediaType
  title: string
  releaseDate: Date | string | null | undefined
}): string {
  return detailPathForMedia(
    item.type as DetailMediaKind,
    item.title,
    releaseDateToYmd(item.releaseDate)
  )
}

function parseSlug(slug: string): { query: string; year: number | null } {
  const yearMatch = slug.match(/-(\d{4})$/)
  if (yearMatch) {
    const year = Number(yearMatch[1])
    if (year >= 1900 && year <= 2099) {
      return { query: slug.slice(0, -5).replace(/-/g, ' '), year }
    }
  }
  return { query: slug.replace(/-/g, ' '), year: null }
}

/** Resolve dynamic segment to numeric TMDB id (numeric id, legacy `123-slug`, or title-year slug). */
/** `/person/id-name` for nicer URLs (matches old site). */
export function personPath(id: number, name: string): string {
  const slug = toSlug(name)
  return slug ? `/person/${id}-${slug}` : `/person/${id}`
}

/** Numeric id or legacy `123-name` segment from `/person/[id]`. */
export function resolvePersonIdFromParam(raw: string): number | null {
  if (/^\d+$/.test(raw)) return Number(raw)
  const legacy = raw.match(/^(\d+)-/)
  if (legacy) return Number(legacy[1])
  return null
}

export async function resolveMovieIdFromParam(raw: string): Promise<number | null> {
  if (/^\d+$/.test(raw)) return Number(raw)
  const oldFormat = raw.match(/^(\d+)-/)
  if (oldFormat) return Number(oldFormat[1])
  const { query, year } = parseSlug(raw)
  const results = await searchMovies(query, year)
  return results[0]?.id ?? null
}

/** Resolve TMDB TV id from numeric id, legacy `123-slug`, or `title-year` slug. */
export async function resolveTvSeriesIdFromParam(raw: string): Promise<number | null> {
  if (/^\d+$/.test(raw)) return Number(raw)
  const oldFormat = raw.match(/^(\d+)-/)
  if (oldFormat) return Number(oldFormat[1])
  const { query, year } = parseSlug(raw)
  const results = await searchTvShows(query, year)
  return results[0]?.id ?? null
}

import { searchMovies, searchTvShows } from '@/lib/tmdb'

export function toSlug(text: string): string {
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

/** Canonical path for `tvshow` shelf cards: `/tvshow/title-year`. */
export function tvshowPath(title: string, firstAirDate?: string | null): string {
  const slug = toSlug(title)
  if (!slug) return '/tvshows'
  const year = firstAirDate && firstAirDate.length >= 4 ? Number(firstAirDate.slice(0, 4)) : null
  const y = year != null && Number.isFinite(year) ? year : null
  return y ? `/tvshow/${slug}-${y}` : `/tvshow/${slug}`
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
      return tvshowPath(title, releaseOrFirstAir)
    case 'cartoon':
      return cartoonPath(title, releaseOrFirstAir)
    default:
      return moviePath(title, releaseOrFirstAir)
  }
}

export function parseSlug(slug: string): { query: string; year: number | null } {
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

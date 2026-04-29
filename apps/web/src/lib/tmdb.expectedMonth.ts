import {
  COMING_HYPE_PHASES,
  COMING_LOOSE_VOTE_TIERS,
  COMING_SHELF_FETCH_MAX_PAGES,
  COMING_SOON_VOTE_TIERS,
  COMING_UPCOMING_ENDPOINT_MAX_PAGES,
} from './tmdb.constants'
import { compareShelfItemsByUpcomingReleaseAsc, isComingShelfMovie } from './tmdb.discoveryFilters'
import { mapToShelfItem } from './tmdb.shelfMapping'
import type { ShelfItem, TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

function passesComingPopMin(m: TmdbRawMedia, min: number | null): boolean {
  if (min == null) return true
  return (m.popularity ?? 0) >= min
}

export function passesComingDiscoverSoftQuality(m: TmdbRawMedia): boolean {
  const pop = m.popularity ?? 0
  const v = m.vote_count ?? 0
  return pop >= 16 || v >= 100
}

async function collectComingMoviesAtVoteFloor(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  dateGte: string,
  dateLte: string,
  targetCount: number,
  voteMin: number,
  popMin: number | null,
  shelfExclude: string,
  extraQuality: (m: TmdbRawMedia) => boolean = () => true
): Promise<ShelfItem[]> {
  const acc: TmdbRawMedia[] = []
  const seen = new Set<number>()
  for (let p = 1; p <= COMING_SHELF_FETCH_MAX_PAGES; p++) {
    const q: Record<string, string> = {
      'primary_release_date.gte': dateGte,
      'primary_release_date.lte': dateLte,
      sort_by: 'primary_release_date.asc',
      without_genres: shelfExclude,
      page: String(p),
    }
    if (voteMin > 0) q['vote_count.gte'] = String(voteMin)
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', q)
    for (const m of res.results) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      acc.push(m)
    }
    const sorted = acc
      .filter(isComingShelfMovie)
      .filter((m) => passesComingPopMin(m, popMin))
      .filter(extraQuality)
      .map((m) => mapToShelfItem(m, 'movie'))
      .sort(compareShelfItemsByUpcomingReleaseAsc)
    if (sorted.length >= targetCount) return sorted.slice(0, targetCount)
    const lastPage = Math.min(COMING_SHELF_FETCH_MAX_PAGES, Math.max(1, res.total_pages))
    if (p >= lastPage) break
  }
  return acc
    .filter(isComingShelfMovie)
    .filter((m) => passesComingPopMin(m, popMin))
    .filter(extraQuality)
    .map((m) => mapToShelfItem(m, 'movie'))
    .sort(compareShelfItemsByUpcomingReleaseAsc)
    .slice(0, targetCount)
}

export async function collectBlockbusterComingMovies(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  dateGte: string,
  dateLte: string,
  targetCount: number,
  shelfExclude: string
): Promise<ShelfItem[]> {
  for (const popMin of COMING_HYPE_PHASES) {
    for (const { movie } of COMING_SOON_VOTE_TIERS) {
      const items = await collectComingMoviesAtVoteFloor(
        tmdbFetch,
        dateGte,
        dateLte,
        targetCount,
        movie,
        popMin,
        shelfExclude
      )
      if (items.length > 0) return items
    }
  }
  for (const { movie } of COMING_LOOSE_VOTE_TIERS) {
    const items = await collectComingMoviesAtVoteFloor(
      tmdbFetch,
      dateGte,
      dateLte,
      targetCount,
      movie,
      null,
      shelfExclude
    )
    if (items.length > 0) return items
  }
  return []
}

export async function collectBlockbusterMoviesForExpectedMonthRail(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  dateGte: string,
  dateLte: string,
  cap: number,
  shelfExclude: string,
  quality: (m: TmdbRawMedia) => boolean
): Promise<ShelfItem[]> {
  const targetCount = Math.max(cap, 18)
  for (const popMin of COMING_HYPE_PHASES) {
    for (const { movie } of COMING_SOON_VOTE_TIERS) {
      const items = await collectComingMoviesAtVoteFloor(
        tmdbFetch,
        dateGte,
        dateLte,
        targetCount,
        movie,
        popMin,
        shelfExclude,
        quality
      )
      if (items.length > 0) return items
    }
  }
  return []
}

export async function discoverExpectedMonthMoviesByPopularity(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  dateGte: string,
  dateLte: string,
  voteGte: number,
  maxPages: number,
  minQualified: number,
  shelfExclude: string,
  quality: (m: TmdbRawMedia) => boolean
): Promise<ShelfItem[]> {
  const acc: TmdbRawMedia[] = []
  const seen = new Set<number>()
  for (let p = 1; p <= maxPages; p++) {
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
      'primary_release_date.gte': dateGte,
      'primary_release_date.lte': dateLte,
      sort_by: 'popularity.desc',
      'vote_count.gte': String(voteGte),
      without_genres: shelfExclude,
      page: String(p),
    })
    for (const m of res.results) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      if (quality(m)) acc.push(m)
    }
    if (acc.length >= minQualified) break
    const lastPage = Math.min(maxPages, Math.max(1, res.total_pages))
    if (p >= lastPage) break
  }
  return acc.map((m) => mapToShelfItem(m, 'movie')).sort(compareShelfItemsByUpcomingReleaseAsc)
}

export function mergeExpectedMonthShelfPools(pools: ShelfItem[][], cap: number): ShelfItem[] {
  const byId = new Map<number, ShelfItem>()
  for (const pool of pools) {
    for (const it of pool) {
      if (!byId.has(it.id)) byId.set(it.id, it)
    }
  }
  return [...byId.values()].sort(compareShelfItemsByUpcomingReleaseAsc).slice(0, cap)
}

export async function fetchTheatricalUpcomingInWindow(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  dateGte: string,
  dateLte: string,
  quality: (m: TmdbRawMedia) => boolean = () => true,
  maxPages = COMING_UPCOMING_ENDPOINT_MAX_PAGES
): Promise<ShelfItem[]> {
  const acc: TmdbRawMedia[] = []
  const seen = new Set<number>()
  for (let page = 1; page <= maxPages; page++) {
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/movie/upcoming', {
      page: String(page),
    })
    for (const m of res.results) {
      if (seen.has(m.id)) continue
      const rd = m.release_date ?? ''
      if (!rd || rd < dateGte || rd > dateLte) continue
      if (!isComingShelfMovie(m)) continue
      if (!quality(m)) continue
      seen.add(m.id)
      acc.push(m)
    }
    if (page >= Math.min(maxPages, Math.max(1, res.total_pages))) break
  }
  return acc.map((m) => mapToShelfItem(m, 'movie')).sort(compareShelfItemsByUpcomingReleaseAsc)
}

export function mergeComingShelfByDate(
  primary: ShelfItem[],
  secondary: ShelfItem[],
  targetCount: number
): ShelfItem[] {
  const byId = new Map<number, ShelfItem>()
  for (const it of primary) byId.set(it.id, it)
  for (const it of secondary) {
    if (!byId.has(it.id)) byId.set(it.id, it)
  }
  return [...byId.values()].sort(compareShelfItemsByUpcomingReleaseAsc).slice(0, targetCount)
}

function lastDayOfMonthIso(year: number, month1to12: number): string {
  const last = new Date(Date.UTC(year, month1to12, 0))
  const d = last.getUTCDate()
  return `${year}-${String(month1to12).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function expectedMonthReleaseWindow(
  year: number,
  month1to12: number,
  todayIso: string
): { dateGte: string; dateLte: string } | null {
  const first = `${year}-${String(month1to12).padStart(2, '0')}-01`
  const last = lastDayOfMonthIso(year, month1to12)
  const dateGte = todayIso > first ? todayIso : first
  const dateLte = last
  if (dateGte > dateLte) return null
  return { dateGte, dateLte }
}

export function monthNameEn(month1to12: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(Date.UTC(2000, month1to12 - 1, 1))
  )
}

export function nextUtcCalendarMonth(d = new Date()): { year: number; month: number } {
  const y = d.getUTCFullYear()
  const m0 = d.getUTCMonth()
  const next = new Date(Date.UTC(y, m0 + 1, 1))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 }
}

import type { MediaType } from '@repo/types'
import {
  CACHE_TAG_ALL_TIME,
  CACHE_TAG_HOME_MODERATE,
  CACHE_TAG_MOVIES,
  CACHE_TAG_PEOPLE,
  CACHE_TAG_TRENDING,
  cacheTagMovie,
  cacheTagPerson,
  cacheTagTv,
  FETCH_REVALIDATE_ALL_TIME,
  FETCH_REVALIDATE_DEFAULT,
  FETCH_REVALIDATE_ENRICHMENT,
  FETCH_REVALIDATE_FAST,
  FETCH_REVALIDATE_MODERATE,
  FETCH_REVALIDATE_PEOPLE,
} from './cachePolicy'
import { containsCyrillic } from './textScript'

const TMDB_BASE = 'https://api.themoviedb.org/3'

/** Read on each request — env may be merged from monorepo root in `next.config.ts` after module graph init order edge cases. */
function getTmdbApiKey(): string {
  return process.env.TMDB_API_KEY?.trim() ?? ''
}

const TMDB_REVALIDATE_DEFAULT = FETCH_REVALIDATE_DEFAULT

/**
 * Per-shelf TMDB cache tiers (homepage + callers that opt in). Re-exported names preserved for imports.
 * Policy lives in `cachePolicy.ts`; see `ROUTE_REVALIDATE_*` for segment ISR.
 */
const TMDB_REVALIDATE_FAST = FETCH_REVALIDATE_FAST /** 15m */
const TMDB_REVALIDATE_MODERATE = FETCH_REVALIDATE_MODERATE /** 30m */
const TMDB_REVALIDATE_PEOPLE = FETCH_REVALIDATE_PEOPLE /** 1h */
const TMDB_REVALIDATE_ALL_TIME = FETCH_REVALIDATE_ALL_TIME /** 24h */
/** 24h — genre/runtime enrichment. Policy source: cachePolicy.ts `FETCH_REVALIDATE_ENRICHMENT`. */
const TMDB_REVALIDATE_ENRICHMENT = FETCH_REVALIDATE_ENRICHMENT

// ── Raw TMDB shapes ─────────────────────────────────────

interface TmdbRawMedia {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count?: number
  popularity: number
  genre_ids?: number[]
}

interface TmdbPaginated<T> {
  results: T[]
}
interface TmdbDiscoverPage<T> extends TmdbPaginated<T> {
  page: number
  total_pages: number
  total_results: number
}
interface TmdbVideosResponse {
  results: Array<{
    key: string
    site: string
    type: string
    official: boolean
    name?: string
    published_at?: string | null
  }>
}

// ── Public types (mapped for MEGDB components) ───────────

export interface HeroItem {
  id: number
  type: 'movie' | 'series'
  title: string
  overview: string
  backdropPath: string
  voteAverage: number
  releaseDate: Date
  /** Up to two genre labels (detail + list merge). */
  genres: string[]
  /** Total runtime in minutes when known. */
  runtime: number | null
  /** YouTube key if found; hero still shows without trailer (Watch Now). */
  trailerKey: string | null
  /** Optional source update timestamp from upstream DB/cache pipeline. */
  updatedAt?: Date | null
}

export interface ShelfItem {
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  overview?: string
  voteAverage: number
  releaseDate: Date | null
  popularity: number
  /** Up to two genre labels (detail API + list fallback). */
  genres: string[]
  /** Minutes; from `/movie/{id}` or `/tv/{id}` detail when available. */
  runtimeMinutes?: number | null
  /** Optional source update timestamp from upstream DB/cache pipeline. */
  updatedAt?: Date | null
  /**
   * TMDB `genre_ids` from list responses — used while enriching; stripped before UI.
   * @internal
   */
  genreIds?: number[]
}

// ── Fetch helper ─────────────────────────────────────────

async function tmdbFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
  init?: { revalidate?: number; tags?: string[] }
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', getTmdbApiKey())
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const revalidate = init?.revalidate ?? TMDB_REVALIDATE_DEFAULT
  const tags = init?.tags
  const res = await fetch(url.toString(), {
    cache: 'force-cache',
    next: { revalidate, ...(tags?.length ? { tags } : {}) },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status} ${endpoint}`)
  return res.json() as Promise<T>
}

// ── Utilities ────────────────────────────────────────────

export function getImageUrl(path: string | null | undefined, size = 'w500'): string {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : ''
}

/** Movie + TV `genre_id` → label (TMDB list + TV catalogue). Missing ids ⇒ no label from discover. */
const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  14: 'Fantasy',
  27: 'Horror',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy',
  37: 'Western',
  36: 'History',
  10402: 'Music',
  10751: 'Family',
  10752: 'War',
  10770: 'TV Movie',
  10768: 'War & Politics',
  10769: 'Foreign',
  /** TV-only (genre/tv/list) */
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10766: 'Soap',
  10767: 'Talk',
}

const HERO_EXCLUDE = new Set([16, 18, 35, 36, 37, 99, 10402, 10749, 10763, 10764, 10766, 10767])
const SHELF_EXCLUDE = '16,99,10402,10764,10767,10763,10766'

/** Parsed `SHELF_EXCLUDE` — redundant client-side filter if TMDB omits `without_genres` on an item. */
const SHELF_EXCLUDED_GENRE_IDS = new Set(
  SHELF_EXCLUDE.split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
)

/** TMDB movie genre "TV Movie" — not counted as theatrical / feature "cinema" for New This Week. */
const TV_MOVIE_GENRE_ID = 10770
/** Trending browse should avoid one-off low-signal titles while keeping enough fresh cards. */
const TRENDING_MIN_VOTE_COUNT = 25

/**
 * Discover `/movies?coming` & `/series?coming` — baseline vote floors (first try is stricter in-code).
 */
export const COMING_BLOCKBUSTER_MOVIE_VOTE_MIN = 120
export const COMING_BLOCKBUSTER_TV_VOTE_MIN = 70
const COMING_SHELF_FETCH_MAX_PAGES = 14
/** TMDB `/movie/upcoming` pages to merge into the homepage rail (theatrical skew). */
const COMING_UPCOMING_ENDPOINT_MAX_PAGES = 5

const EXPECTED_MONTH_POPULARITY_DISCOVER_PAGES = 12

function comingSoonVoteTiers(): { movie: number; tv: number }[] {
  return [
    { movie: 380, tv: 220 },
    { movie: 300, tv: 170 },
    { movie: 240, tv: 130 },
    { movie: 190, tv: 100 },
    { movie: 150, tv: 75 },
  ]
}

const COMING_HYPE_PHASES: (number | null)[] = [34, 22, null]

const COMING_LOOSE_VOTE_TIERS: { movie: number; tv: number }[] = [
  { movie: 120, tv: 65 },
  { movie: 90, tv: 50 },
  { movie: 60, tv: 35 },
]

function passesComingPopMin(m: TmdbRawMedia, min: number | null): boolean {
  if (min == null) return true
  return (m.popularity ?? 0) >= min
}

/** Discover list: keep the page usable — mainstream OR strong vote signal. */
function passesComingDiscoverSoftQuality(m: TmdbRawMedia): boolean {
  const pop = m.popularity ?? 0
  const v = m.vote_count ?? 0
  return pop >= 16 || v >= 100
}

/**
 * Sports-entertainment / combat broadcasts (WWE PPV, MMA numbered events, etc.) are often
 * typed as "movie" in TMDB with generic Action/Drama genres — exclude from New This Week.
 */
const COMBAT_SPORTS_PROGRAM_RE = new RegExp(
  [
    '\\bWWE\\b',
    'WrestleMania',
    'Wrestlemania',
    '\\bAEW\\b',
    'All Elite Wrestling',
    'Impact Wrestling',
    'Ring of Honor',
    '\\bNJPW\\b',
    'New Japan Pro',
    '\\bBellator\\b',
    '\\bUFC\\s+[0-9]{2,4}\\b',
    'UFC Fight Night',
    'ONE Championship:\\s*Fight',
    'mixed martial arts event',
    'pay-per-view\\s+(?:wrestling|mma|boxing)',
  ].join('|'),
  'i'
)

function isCombatSportsOrWrestlingProgram(m: TmdbRawMedia): boolean {
  const blob = [m.title, m.name, m.original_title, m.original_name, m.overview]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join('\n')
  return COMBAT_SPORTS_PROGRAM_RE.test(blob)
}

function passesShelfGenreFilter(m: TmdbRawMedia): boolean {
  const ids = m.genre_ids
  if (!ids?.length) return true
  return !ids.some((id) => SHELF_EXCLUDED_GENRE_IDS.has(id))
}

function isNewThisWeekMovie(m: TmdbRawMedia): boolean {
  if (isCombatSportsOrWrestlingProgram(m)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) return false
  return true
}

function isNewThisWeekSeries(m: TmdbRawMedia): boolean {
  if (isCombatSportsOrWrestlingProgram(m)) return false
  return passesShelfGenreFilter(m)
}

export function isMainstreamTrendingMovie(
  m: TmdbRawMedia,
  todayIso = new Date().toISOString().slice(0, 10)
): boolean {
  if (!m.genre_ids?.length) return false
  if (isCombatSportsOrWrestlingProgram(m)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) return false
  if ((m.vote_count ?? 0) < TRENDING_MIN_VOTE_COUNT) return false
  const releaseDate = m.release_date ?? ''
  if (!releaseDate) return false
  if (releaseDate > todayIso) return false
  return true
}

function daysBetweenIsoDates(aIso: string, bIso: string): number {
  const a = Date.parse(aIso)
  const b = Date.parse(bIso)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((a - b) / (24 * 60 * 60 * 1000)))
}

function trendingRecencyBonus(releaseDate: string | undefined, todayIso: string): number {
  if (!releaseDate) return 0
  const daysOld = daysBetweenIsoDates(todayIso, releaseDate)
  if (!Number.isFinite(daysOld)) return 0
  if (daysOld <= 45) return 260
  if (daysOld <= 120) return 140
  if (daysOld <= 365) return 60
  return 0
}

export function applyTrendingRecencyBias(
  rows: TmdbRawMedia[],
  todayIso = new Date().toISOString().slice(0, 10)
): TmdbRawMedia[] {
  const ranked = rows.map((row, idx) => {
    const tmdbRankScore = (rows.length - idx) * 100
    const freshnessScore = trendingRecencyBonus(row.release_date, todayIso)
    return { row, idx, score: tmdbRankScore + freshnessScore }
  })
  ranked.sort((a, b) => {
    const byScore = b.score - a.score
    if (byScore !== 0) return byScore
    return a.idx - b.idx
  })
  return ranked.map((x) => x.row)
}

/** Upcoming shelf: poster + same fiction / genre guards as “New This Week” (no combat PPV, etc.). */
function isComingShelfMovie(m: TmdbRawMedia): boolean {
  if (!m.poster_path) return false
  if (isCombatSportsOrWrestlingProgram(m)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) return false
  return true
}

/**
 * Stricter than browse “coming” soft tiers: pre-release rails should look like wide releases,
 * not early-calendar obscure titles from `/movie/upcoming`.
 */
function passesExpectedMonthBlockbusterRaw(m: TmdbRawMedia): boolean {
  if (!isComingShelfMovie(m)) return false
  const v = m.vote_count ?? 0
  const p = m.popularity ?? 0
  if (p >= 48) return true
  if (v >= 280) return true
  if (v >= 200 && p >= 30) return true
  if (v >= 140 && p >= 38) return true
  if (v >= 95 && p >= 42) return true
  return false
}

/** Keep blockbuster profile when strict pool is too small (prevents disappearing rail). */
function passesExpectedMonthBlockbusterFallbackRaw(m: TmdbRawMedia): boolean {
  if (!isComingShelfMovie(m)) return false
  const v = m.vote_count ?? 0
  const p = m.popularity ?? 0
  if (p >= 40) return true
  if (v >= 180) return true
  if (v >= 120 && p >= 26) return true
  if (v >= 80 && p >= 30) return true
  if (v >= 60 && p >= 34) return true
  return false
}

/** Soonest theatrical / air date first; missing dates last; popularity breaks ties. */
function compareTmdbUpcomingReleaseAsc(a: TmdbRawMedia, b: TmdbRawMedia): number {
  const da = a.release_date || a.first_air_date || ''
  const db = b.release_date || b.first_air_date || ''
  if (!da && !db) return b.popularity - a.popularity
  if (!da) return 1
  if (!db) return -1
  const byDate = da.localeCompare(db)
  if (byDate !== 0) return byDate
  return b.popularity - a.popularity
}

function sortDiscoverPageByReleaseAsc(
  data: TmdbDiscoverPage<TmdbRawMedia>
): TmdbDiscoverPage<TmdbRawMedia> {
  return { ...data, results: [...data.results].sort(compareTmdbUpcomingReleaseAsc) }
}

/** Exported for tests — homepage / browse “coming soon” rails use this order. */
export function compareShelfItemsByUpcomingReleaseAsc(a: ShelfItem, b: ShelfItem): number {
  const ta = a.releaseDate?.getTime()
  const tb = b.releaseDate?.getTime()
  if (ta == null && tb == null) return b.popularity - a.popularity
  if (ta == null) return 1
  if (tb == null) return -1
  const d = ta - tb
  if (d !== 0) return d
  return b.popularity - a.popularity
}

async function collectComingMoviesAtVoteFloor(
  dateGte: string,
  dateLte: string,
  targetCount: number,
  voteMin: number,
  popMin: number | null,
  extraQuality: (m: TmdbRawMedia) => boolean = () => true
): Promise<ShelfItem[]> {
  const acc: TmdbRawMedia[] = []
  const seen = new Set<number>()
  for (let p = 1; p <= COMING_SHELF_FETCH_MAX_PAGES; p++) {
    const q: Record<string, string> = {
      'primary_release_date.gte': dateGte,
      'primary_release_date.lte': dateLte,
      sort_by: 'primary_release_date.asc',
      without_genres: SHELF_EXCLUDE,
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

async function collectBlockbusterComingMovies(
  dateGte: string,
  dateLte: string,
  targetCount: number
): Promise<ShelfItem[]> {
  for (const popMin of COMING_HYPE_PHASES) {
    for (const { movie } of comingSoonVoteTiers()) {
      const items = await collectComingMoviesAtVoteFloor(
        dateGte,
        dateLte,
        targetCount,
        movie,
        popMin
      )
      if (items.length > 0) return items
    }
  }
  for (const { movie } of COMING_LOOSE_VOTE_TIERS) {
    const items = await collectComingMoviesAtVoteFloor(dateGte, dateLte, targetCount, movie, null)
    if (items.length > 0) return items
  }
  return []
}

/** Date-asc discover tiers + blockbuster filter; no loose “fill junk” phases. */
async function collectBlockbusterMoviesForExpectedMonthRail(
  dateGte: string,
  dateLte: string,
  cap: number,
  quality: (m: TmdbRawMedia) => boolean = passesExpectedMonthBlockbusterRaw
): Promise<ShelfItem[]> {
  const targetCount = Math.max(cap, 18)
  for (const popMin of COMING_HYPE_PHASES) {
    for (const { movie } of comingSoonVoteTiers()) {
      const items = await collectComingMoviesAtVoteFloor(
        dateGte,
        dateLte,
        targetCount,
        movie,
        popMin,
        quality
      )
      if (items.length > 0) return items
    }
  }
  return []
}

async function discoverExpectedMonthMoviesByPopularity(
  dateGte: string,
  dateLte: string,
  voteGte: number,
  maxPages: number,
  minQualified: number,
  quality: (m: TmdbRawMedia) => boolean = passesExpectedMonthBlockbusterRaw
): Promise<ShelfItem[]> {
  const acc: TmdbRawMedia[] = []
  const seen = new Set<number>()
  for (let p = 1; p <= maxPages; p++) {
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
      'primary_release_date.gte': dateGte,
      'primary_release_date.lte': dateLte,
      sort_by: 'popularity.desc',
      'vote_count.gte': String(voteGte),
      without_genres: SHELF_EXCLUDE,
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

/** Earlier pools win on id — pass hype-first sources first so TMDB order doesn’t bury blockbusters. */
function mergeExpectedMonthShelfPools(pools: ShelfItem[][], cap: number): ShelfItem[] {
  const byId = new Map<number, ShelfItem>()
  for (const pool of pools) {
    for (const it of pool) {
      if (!byId.has(it.id)) byId.set(it.id, it)
    }
  }
  return [...byId.values()].sort(compareShelfItemsByUpcomingReleaseAsc).slice(0, cap)
}

async function fetchTheatricalUpcomingInWindow(
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

function mergeComingShelfByDate(
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

function expectedMonthReleaseWindow(
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

function monthNameEn(month1to12: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(Date.UTC(2000, month1to12 - 1, 1))
  )
}

function nextUtcCalendarMonth(d = new Date()): { year: number; month: number } {
  const y = d.getUTCFullYear()
  const m0 = d.getUTCMonth()
  const next = new Date(Date.UTC(y, m0 + 1, 1))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 }
}

const _unusedDiscoverRailHelpers = [
  EXPECTED_MONTH_POPULARITY_DISCOVER_PAGES,
  passesExpectedMonthBlockbusterFallbackRaw,
  collectBlockbusterComingMovies,
  collectBlockbusterMoviesForExpectedMonthRail,
  discoverExpectedMonthMoviesByPopularity,
  mergeExpectedMonthShelfPools,
  fetchTheatricalUpcomingInWindow,
  mergeComingShelfByDate,
  monthNameEn,
  nextUtcCalendarMonth,
  mergeMovieDetailShellAndTail,
] as const
void _unusedDiscoverRailHelpers

/** Prefer TMDB detail order, then fill from list labels without duplicates. */
function mergeUpToTwoGenres(detailNames: string[], listLabels: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    const k = t.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    out.push(t)
  }
  for (const n of detailNames) push(n)
  if (out.length < 2) {
    for (const n of listLabels) {
      push(n)
      if (out.length >= 2) break
    }
  }
  return out
}

function labelsFromGenreIds(ids: number[] | undefined): string[] {
  if (!ids?.length) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    const label = GENRE_NAMES[id]
    if (!label) continue
    const k = label.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(label)
  }
  return out
}

function mapToShelfItem(item: TmdbRawMedia, type: MediaType): ShelfItem {
  const dateStr = item.release_date || item.first_air_date
  const genreIds = item.genre_ids ?? []
  const listLabels = labelsFromGenreIds(genreIds)
  const genres = mergeUpToTwoGenres([], listLabels)
  return {
    id: item.id,
    type,
    title: item.title ?? item.name ?? 'Untitled',
    posterPath: item.poster_path,
    overview: item.overview ?? '',
    voteAverage: item.vote_average,
    releaseDate: dateStr ? new Date(dateStr) : null,
    popularity: item.popularity,
    genres,
    genreIds,
  }
}

/** Detail endpoints — list views omit full `genres` names, `runtime` / episode length. Chunked to ease TMDB load. */
async function enrichShelfItemsWithDetails(
  items: ShelfItem[],
  revalidate = TMDB_REVALIDATE_ENRICHMENT
): Promise<ShelfItem[]> {
  // chunkSize 16: doubles parallelism vs original 8, halving sequential round-trips.
  // Genre names and runtime are stable data — safe to fetch in larger parallel batches.
  const chunkSize = 16
  const out: ShelfItem[] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const done = await Promise.all(
      chunk.map((item) => enrichOneShelfItem(item, revalidate).catch(() => item))
    )
    out.push(...done)
  }
  return out.map(stripShelfGenreIds)
}

function stripShelfGenreIds(item: ShelfItem): ShelfItem {
  const { genreIds, ...rest } = item
  void genreIds
  return rest
}

function mergeGenresForShelf(detailNames: string[], item: ShelfItem): string[] {
  const fromIds = labelsFromGenreIds(item.genreIds)
  const listGenres = Array.isArray(item.genres) ? item.genres : []
  return mergeUpToTwoGenres(detailNames, [...fromIds, ...listGenres])
}

const KEYWORD_SKIP = /^(based on|sequel|prequel|spin-?off|remake|part \d)/i
const KEYWORD_META =
  /(stinger|imdb|reference to|after credits|during credits|aftercredits|duringcredits)/i

function matchGenreLabelsFromKeywordResults(
  results: { name: string }[] | undefined,
  genres: string[]
): string[] {
  if (genres.length >= 2) return genres.slice(0, 2)
  const have = new Set(genres.map((g) => g.trim().toLowerCase()).filter(Boolean))
  const genreLabels = Object.values(GENRE_NAMES)

  for (const { name } of results ?? []) {
    const raw = name.trim()
    if (!raw || KEYWORD_SKIP.test(raw)) continue
    const k = raw.toLowerCase()
    for (const label of genreLabels) {
      const gl = label.toLowerCase()
      if (gl.length < 3) continue
      if (gl === k && !have.has(gl)) {
        have.add(gl)
        return [...genres, label].slice(0, 2)
      }
    }
  }
  for (const { name } of results ?? []) {
    const raw = name.trim()
    if (!raw || KEYWORD_SKIP.test(raw)) continue
    const k = raw.toLowerCase()
    for (const label of genreLabels) {
      const gl = label.toLowerCase()
      if (gl.length < 4) continue
      if (k.includes(gl) && !have.has(gl)) {
        return [...genres, label].slice(0, 2)
      }
    }
  }
  return genres.slice(0, 2)
}

/** Second chip when genre dictionary match fails — short TMDB keyword (hospital, lgbt, …). */
function pickThematicKeywordLabel(
  results: { name: string }[] | undefined,
  primaryGenre: string
): string | null {
  const p = primaryGenre.trim().toLowerCase()
  for (const { name } of results ?? []) {
    let raw = name.trim()
    if (!raw || KEYWORD_SKIP.test(raw) || KEYWORD_META.test(raw)) continue
    raw = raw.split(',')[0]!.trim()
    if (raw.length < 3 || raw.length > 28) continue
    const low = raw.toLowerCase()
    if (low === p) continue
    if (p.length >= 4 && (low === `${p} movie` || low === `${p} film` || low === `${p} series`))
      continue
    const words = raw.split(/\s+/).slice(0, 4).join(' ')
    if (words.length < 3) continue
    return words
  }
  return null
}

/**
 * 1) Map keywords → official genre names. 2) Else use a thematic keyword so the UI always has two chips when TMDB lists any keywords.
 */
async function padSecondGenreFromKeywords(
  kind: 'movie' | 'tv',
  id: number,
  genres: string[],
  revalidate = TMDB_REVALIDATE_DEFAULT
): Promise<string[]> {
  if (genres.length >= 2) return genres.slice(0, 2)
  try {
    const { results } = await tmdbFetch<{ results: { name: string }[] }>(
      `/${kind === 'tv' ? 'tv' : 'movie'}/${id}/keywords`,
      undefined,
      { revalidate }
    )
    const next = matchGenreLabelsFromKeywordResults(results, genres)
    if (next.length >= 2) return next.slice(0, 2)
    if (next.length === 1) {
      const thematic = pickThematicKeywordLabel(results, next[0]!)
      if (thematic) return [next[0]!, thematic]
    }
  } catch {
    /* keep single genre */
  }
  return genres.slice(0, 2)
}

function tvRuntimeMinutes(d: {
  episode_run_time?: number[]
  last_episode_to_run?: { runtime?: number | null }
}): number | null {
  const arr = d.episode_run_time?.filter((n) => n > 0) ?? []
  if (arr.length) return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  const last = d.last_episode_to_run?.runtime
  if (last != null && last > 0) return last
  return null
}

/** Many shows omit `episode_run_time` / last-episode runtime on the main `/tv/{id}` object — try the episode resource. */
async function tvRuntimeWithEpisodeFallback(
  tvId: number,
  d: {
    episode_run_time?: number[]
    last_episode_to_run?: {
      runtime?: number | null
      season_number?: number
      episode_number?: number
    }
  },
  revalidate = TMDB_REVALIDATE_DEFAULT
): Promise<number | null> {
  const direct = tvRuntimeMinutes(d)
  if (direct != null) return direct

  const last = d.last_episode_to_run
  if (last?.season_number != null && last.episode_number != null) {
    try {
      const ep = await tmdbFetch<{ runtime?: number | null }>(
        `/tv/${tvId}/season/${last.season_number}/episode/${last.episode_number}`,
        undefined,
        { revalidate }
      )
      if (ep.runtime != null && ep.runtime > 0) return ep.runtime
    } catch {
      /* fall through */
    }
  }

  try {
    const ep = await tmdbFetch<{ runtime?: number | null }>(
      `/tv/${tvId}/season/1/episode/1`,
      undefined,
      { revalidate }
    )
    if (ep.runtime != null && ep.runtime > 0) return ep.runtime
  } catch {
    /* no runtime in TMDB */
  }

  return null
}

async function enrichOneShelfItem(
  item: ShelfItem,
  revalidate = TMDB_REVALIDATE_DEFAULT
): Promise<ShelfItem> {
  if (item.type === 'movie' || item.type === 'cartoon') {
    try {
      const d = await tmdbFetch<{
        runtime?: number | null
        genres?: { name: string }[]
      }>(`/movie/${item.id}`, undefined, { revalidate })
      const runtimeMinutes = d.runtime != null && d.runtime > 0 ? d.runtime : null
      const detailNames = (d.genres ?? []).map((g) => g.name)
      let genres = mergeGenresForShelf(detailNames, item)
      genres = await padSecondGenreFromKeywords('movie', item.id, genres, revalidate)
      return { ...item, genres, runtimeMinutes }
    } catch {
      return item
    }
  }
  if (item.type === 'series' || item.type === 'tvshow') {
    try {
      const d = await tmdbFetch<{
        episode_run_time?: number[]
        last_episode_to_run?: {
          runtime?: number | null
          season_number?: number
          episode_number?: number
        }
        last_episode_to_air?: { air_date?: string; season_number?: number }
        first_air_date?: string
        number_of_seasons?: number
        genres?: { name: string }[]
      }>(`/tv/${item.id}`, undefined, { revalidate })
      const runtimeMinutes = await tvRuntimeWithEpisodeFallback(item.id, d, revalidate)
      const detailNames = (d.genres ?? []).map((g) => g.name)
      let genres = mergeGenresForShelf(detailNames, item)
      genres = await padSecondGenreFromKeywords('tv', item.id, genres, revalidate)
      return { ...item, genres, runtimeMinutes }
    } catch {
      return item
    }
  }
  return item
}

/** Dedupe by YouTube `key`, preserve first-seen order (en-US list before original-language). */
function mergeTmdbMovieVideoResults(
  ...lists: Array<TmdbVideosResponse['results'] | undefined>
): TmdbVideosResponse['results'] {
  const seen = new Set<string>()
  const out: TmdbVideosResponse['results'] = []
  for (const list of lists) {
    for (const v of list ?? []) {
      const k = typeof v.key === 'string' ? v.key.trim() : ''
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(v)
    }
  }
  return out
}

function videoTypeNorm(t: string | undefined): string {
  return (t ?? '').trim().toLowerCase()
}

function pickPrimaryYoutubeVideo(
  results: TmdbVideosResponse['results'] | undefined
): { key: string; name: string; type: string; publishedAt: string | null } | null {
  if (!results?.length) return null
  const yt = results.filter((v) => (v.site ?? '').toLowerCase() === 'youtube')
  if (!yt.length) return null
  const ty = videoTypeNorm
  const v =
    yt.find((x) => ty(x.type) === 'trailer' && x.official) ??
    yt.find((x) => ty(x.type) === 'trailer') ??
    yt.find((x) => ty(x.type) === 'teaser' && x.official) ??
    yt.find((x) => ty(x.type) === 'teaser') ??
    yt.find((x) => ty(x.type) === 'clip' && x.official) ??
    yt.find((x) => ty(x.type) === 'clip') ??
    yt.find((x) => ty(x.type) === 'featurette') ??
    yt[0] ??
    null
  if (!v) return null
  return {
    key: v.key,
    name: typeof v.name === 'string' && v.name.trim() ? v.name.trim() : 'Trailer',
    type: v.type,
    publishedAt: v.published_at?.trim() ? v.published_at.trim() : null,
  }
}

function pickTrailerKeyFromResults(
  results: TmdbVideosResponse['results'] | undefined
): string | null {
  return pickPrimaryYoutubeVideo(results)?.key ?? null
}

/** Title search for slug → id resolution on `/movie/[slug-year]`. */
export async function searchMovies(query: string, year?: number | null): Promise<TmdbRawMedia[]> {
  try {
    const params: Record<string, string> = { query }
    if (year != null) params.year = String(year)
    const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>('/search/movie', params, {
      revalidate: TMDB_REVALIDATE_MODERATE,
    })
    return res.results ?? []
  } catch {
    return []
  }
}

export async function searchTvShows(query: string, year?: number | null): Promise<TmdbRawMedia[]> {
  try {
    const params: Record<string, string> = { query }
    if (year != null) params.first_air_date_year = String(year)
    const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>('/search/tv', params, {
      revalidate: TMDB_REVALIDATE_MODERATE,
    })
    return res.results ?? []
  } catch {
    return []
  }
}

// ── Movie detail page (`/movie/[id]`) ───────────────────

const PROVIDER_QUALITY: Record<number, string> = {
  8: '4K HDR',
  1796: '4K HDR',
  9: '4K HDR',
  10: '4K HDR',
  119: '4K HDR',
  2100: '4K HDR',
  337: '4K HDR',
  384: '4K HDR',
  1899: '4K HDR',
  2: '4K HDR',
  350: '4K HDR',
  300: '4K HDR',
  15: 'Full HD',
  531: 'Full HD',
  386: 'HD',
  387: 'HD',
  283: 'HD',
  73: 'HD',
  192: 'HD',
  538: 'HD',
}

const WATCH_NOW_URLS: Record<number, string> = {
  8: 'https://www.netflix.com/search?q=%s',
  1796: 'https://www.netflix.com/search?q=%s',
  9: 'https://www.primevideo.com/search/ref=atv_sr_sug_4?phrase=%s',
  10: 'https://www.amazon.com/s?k=%s&i=instant-video',
  119: 'https://www.primevideo.com/search/ref=atv_sr_sug_4?phrase=%s',
  2100: 'https://www.primevideo.com/search/ref=atv_sr_sug_4?phrase=%s',
  337: 'https://www.disneyplus.com/search?q=%s',
  15: 'https://www.hulu.com/search?q=%s',
  384: 'https://www.max.com/search?q=%s',
  1899: 'https://www.max.com/search?q=%s',
  386: 'https://www.peacocktv.com/search?q=%s',
  387: 'https://www.peacocktv.com/search?q=%s',
  531: 'https://www.paramountplus.com/search/?q=%s',
  2: 'https://tv.apple.com/search?term=%s',
  350: 'https://tv.apple.com/search?term=%s',
  300: 'https://tv.apple.com/search?term=%s',
  192: 'https://www.youtube.com/results?search_query=%s',
  73: 'https://tubitv.com/search?q=%s',
  538: 'https://watch.plex.tv/search?q=%s',
  283: 'https://www.crunchyroll.com/search?q=%s',
}

function buildWatchNowUrl(providerId: number, title: string, fallback: string): string {
  const template = WATCH_NOW_URLS[providerId]
  return template ? template.replace('%s', encodeURIComponent(title)) : fallback
}

export function buildWatchProviderUrl(
  providerId: number,
  providerName: string,
  title: string,
  fallback: string | null | undefined
): string {
  const directById = WATCH_NOW_URLS[providerId]
  if (directById) return directById.replace('%s', encodeURIComponent(title))

  const normalized = providerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
  const byNameTemplate =
    normalized.includes('fandango at home') || normalized.includes('vudu')
      ? 'https://www.vudu.com/content/movies/search?searchString=%s'
      : normalized.includes('google play')
        ? 'https://play.google.com/store/search?q=%s&c=movies'
        : normalized.includes('microsoft store')
          ? 'https://www.microsoft.com/en-us/search/shop/movies?q=%s'
          : normalized.includes('amc+')
            ? 'https://www.amcplus.com/'
            : normalized.includes('starz')
              ? 'https://www.starz.com/'
              : normalized.includes('showtime')
                ? 'https://www.paramountplus.com/shows/showtime/'
                : normalized.includes('mubi')
                  ? 'https://mubi.com/search?query=%s'
                  : normalized.includes('kanopy')
                    ? 'https://www.kanopy.com/en/search?query=%s'
                    : normalized.includes('hoopla')
                      ? 'https://www.hoopladigital.com/search?q=%s'
                      : normalized.includes('roku channel')
                        ? 'https://therokuchannel.roku.com/'
                        : normalized.includes('pluto')
                          ? 'https://pluto.tv/'
                          : null

  if (byNameTemplate) {
    return byNameTemplate.includes('%s')
      ? byNameTemplate.replace('%s', encodeURIComponent(title))
      : byNameTemplate
  }

  const safeFallback = fallback?.trim() ? fallback.trim() : ''
  if (safeFallback && !safeFallback.includes('tmdb.org')) return safeFallback

  // Final safety net: never send users to TMDB from the provider tiles.
  return `https://www.google.com/search?q=${encodeURIComponent(`${providerName} ${title} watch`)}`
}

interface TmdbWatchProviderRef {
  provider_id: number
  provider_name: string
  logo_path?: string | null
}

interface TmdbWatchCountry {
  link?: string
  flatrate?: TmdbWatchProviderRef[]
  free?: TmdbWatchProviderRef[]
  rent?: TmdbWatchProviderRef[]
  buy?: TmdbWatchProviderRef[]
}

interface TmdbWatchProvidersPayload {
  results?: Record<string, TmdbWatchCountry>
}

export interface MoviePageCastMember {
  id: number
  name: string
  character: string | null
  profilePath: string | null
}

interface MovieWatchProviderRow {
  providerId: number
  name: string
  logoPath: string | null
  type: 'Stream' | 'Free' | 'Rent' | 'Buy'
  quality: string
}

interface MoviePageCrewRef {
  id: number
  name: string
}

export interface MoviePageCardItem {
  id: number
  title: string
  posterPath: string | null
  releaseDate: string | null
  voteAverage: number
  genres?: string[]
  runtimeMinutes?: number | null
}

interface MovieWatchProviderItem {
  providerId: number
  providerName: string
  logoPath: string | null
}

/** US watch providers for sidebar (Stream = flatrate ∪ free, deduped). */
export interface MovieWatchProvidersUs {
  link: string | null
  stream: MovieWatchProviderItem[]
  rent: MovieWatchProviderItem[]
  buy: MovieWatchProviderItem[]
}

export interface MovieBackdropStill {
  filePath: string
  width: number
  height: number
}

export interface MoviePageDetail {
  id: number
  title: string
  originalTitle: string
  tagline: string | null
  overview: string
  releaseDate: string | null
  runtime: number | null
  posterPath: string | null
  /** Optional persisted BlurHash for poster/backdrop placeholders. */
  blurHash?: string | null
  /** Optional persisted dominant color hex (`#RRGGBB`) for detail theming. */
  primaryColor?: string | null
  backdropPath: string | null
  voteAverage: number
  voteCount: number
  genres: { id: number; name: string }[]
  homepage: string | null
  imdbId: string | null
  budget: number
  revenue: number
  status: string | null
  originalLanguage: string | null
  productionCountries: { iso: string; name: string }[]
  productionCompanies: { id: number; name: string }[]
  director: MoviePageCrewRef | null
  directorNames: string[]
  writers: MoviePageCrewRef[]
  starsForMeta: MoviePageCrewRef[]
  cast: MoviePageCastMember[]
  trailerYoutubeKey: string | null
  trailer: {
    key: string
    name: string
    type: string
    publishedAt: string | null
  } | null
  /** Age-style label for UI, e.g. "13+", "17+". From RU/GB numeric certs when present, else US MPA mapping. */
  ageRatingBadge: string | null
  justWatchLink: string | null
  watchRows: MovieWatchProviderRow[]
  streamingNames: string[]
  watchNowUrl: string | null
  watchNowLogoUrl: string | null
  watchNowProviderName: string | null
  similar: MoviePageCardItem[]
  collection: null | {
    id: number
    name: string
    parts: MoviePageCardItem[]
  }
  backdropGallery: MovieBackdropStill[]
  /** Up to 10 TMDB backdrop stills for the detail hero carousel (loaded in shell with `/images`). */
  heroBackdropStills: MovieBackdropStill[]
  watchProvidersUs: MovieWatchProvidersUs | null
  /** Latin / US-style title from TMDB alternative titles — shown under H1 when tagline is Cyrillic or missing */
  alternateDisplayTitle: string | null
  /** TV detail only — seasons from TMDB (season 0 specials excluded) for `TVSeason` JSON-LD. */
  tvSeasonSummaries?: Array<{
    seasonNumber: number
    name: string
    episodeCount: number
    airDate: string | null
  }>
  /**
   * TMDB `belongs_to_collection` (id + name) while full `collection.parts` still load in the streamed tail.
   * Cleared when `getMoviePageData` merges a full `collection` object.
   */
  belongsToCollectionMeta?: { id: number; name: string } | null
}

/** Input for `getMoviePageDataTailMovie` — derived from the shell row (no extra TMDB round-trip). */
export interface MoviePageDetailTailInput {
  mediaId: number
  genreIds: number[]
  releaseYear: number | null
  collectionTmdbId: number | null
}

interface MoviePageDetailTailPatch {
  similar: MoviePageCardItem[]
  collection: MoviePageDetail['collection']
  backdropGallery: MovieBackdropStill[]
}

/** Max backdrop slides for movie/TV detail hero carousel (TMDB `/images` backdrops). */
const HERO_DETAIL_BACKDROP_MAX = 10

type TmdbBackdropImageRow = {
  file_path?: string | null
  vote_average?: number
  width?: number
  height?: number
}

function pickHeroBackdropStillsForShell(
  rows: TmdbBackdropImageRow[] | undefined,
  preferredFilePath: string | null | undefined
): MovieBackdropStill[] {
  const normalized = (rows ?? [])
    .map((b) => ({
      filePath: (b.file_path ?? '').trim(),
      width: typeof b.width === 'number' && b.width > 0 ? b.width : 1280,
      height: typeof b.height === 'number' && b.height > 0 ? b.height : 720,
      vote: typeof b.vote_average === 'number' ? b.vote_average : 0,
    }))
    .filter((b) => b.filePath.length > 0)
    .sort((a, b) => b.vote - a.vote)

  const seen = new Set<string>()
  const out: MovieBackdropStill[] = []
  const push = (filePath: string, width: number, height: number) => {
    if (!filePath || seen.has(filePath)) return
    seen.add(filePath)
    out.push({ filePath, width, height })
  }

  const pref = preferredFilePath?.trim()
  if (pref) {
    const hit = normalized.find((r) => r.filePath === pref)
    push(pref, hit?.width ?? 1280, hit?.height ?? 720)
  }
  for (const r of normalized) {
    if (out.length >= HERO_DETAIL_BACKDROP_MAX) break
    push(r.filePath, r.width, r.height)
  }
  return out
}

function mergeMovieDetailShellAndTail(
  shell: MoviePageDetail,
  tail: MoviePageDetailTailPatch
): MoviePageDetail {
  const { belongsToCollectionMeta: shellMeta, ...shellBase } = shell
  return {
    ...shellBase,
    similar: tail.similar,
    collection: tail.collection,
    backdropGallery: tail.backdropGallery,
    ...(tail.collection == null && shellMeta != null ? { belongsToCollectionMeta: shellMeta } : {}),
  }
}

/** TMDB tail for movie detail: gallery, similar, collection rails (used by streamed below-fold RSC). */
export async function getMoviePageDataTailMovie(
  input: MoviePageDetailTailInput
): Promise<MoviePageDetailTailPatch> {
  const id = input.mediaId
  if (!Number.isFinite(id) || id <= 0) {
    return { similar: [], collection: null, backdropGallery: [] }
  }
  try {
    const [similarPage, imagesPayload, collectionPayload] = await Promise.all([
      tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
        `/movie/${id}/similar`,
        { page: '1' },
        { revalidate: TMDB_REVALIDATE_MODERATE }
      ).catch(() => null),
      tmdbFetch<{
        backdrops?: Array<{
          file_path: string
          vote_average: number
          width?: number
          height?: number
        }>
      }>(`/movie/${id}/images`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
      }).catch(() => null),
      input.collectionTmdbId
        ? tmdbFetch<{ id: number; name: string; parts?: TmdbRawMedia[] }>(
            `/collection/${input.collectionTmdbId}`,
            undefined,
            { revalidate: TMDB_REVALIDATE_MODERATE }
          ).catch(() => null)
        : Promise.resolve(null),
    ])

    const backdrops: MovieBackdropStill[] = (imagesPayload?.backdrops ?? [])
      .sort((a, b) => b.vote_average - a.vote_average)
      .map((b) => ({
        filePath: b.file_path,
        width: typeof b.width === 'number' && b.width > 0 ? b.width : 1280,
        height: typeof b.height === 'number' && b.height > 0 ? b.height : 720,
      }))

    const currentGenreIds = new Set(
      input.genreIds.filter((gid): gid is number => typeof gid === 'number' && Number.isFinite(gid))
    )
    const currentYear = input.releaseYear

    const [collection, similar] = await Promise.all([
      (async (): Promise<MoviePageDetail['collection']> => {
        if (!collectionPayload?.parts?.length) return null
        const rawParts = collectionPayload.parts.map(mapRawToCardItem)
        const parts = await enrichMoviePageCardItemsWithDetails(rawParts, TMDB_REVALIDATE_MODERATE)
        if (parts.length <= 1) return null
        return {
          id: collectionPayload.id,
          name: collectionPayload.name?.trim() || 'Collection',
          parts,
        }
      })(),
      (async (): Promise<MoviePageCardItem[]> => {
        const discoverSimilarRaw =
          Number.isFinite(currentYear) && currentGenreIds.size > 0
            ? await fetchDiscoverMoviesByGenresAndYears(
                [...currentGenreIds],
                [currentYear as number, (currentYear as number) - 1],
                id,
                TMDB_REVALIDATE_MODERATE
              )
            : []

        const combinedSimilarRaw: TmdbRawMedia[] = (() => {
          const out: TmdbRawMedia[] = []
          const seen = new Set<number>()
          for (const m of [...(similarPage?.results ?? []), ...discoverSimilarRaw]) {
            if (!m?.id || m.id === id || seen.has(m.id)) continue
            seen.add(m.id)
            out.push(m)
          }
          return out
        })()

        const relevantSimilarRaw = pickRelevantSimilarItems(
          combinedSimilarRaw,
          currentGenreIds,
          Number.isFinite(currentYear) ? currentYear : null,
          16
        )
        const similarBase = relevantSimilarRaw.map(mapRawToCardItem)
        return enrichMoviePageCardItemsWithDetails(similarBase, TMDB_REVALIDATE_MODERATE)
      })(),
    ])

    return { similar, collection, backdropGallery: backdrops }
  } catch {
    return { similar: [], collection: null, backdropGallery: [] }
  }
}

/** TMDB tail for TV detail: backdrop gallery + similar (no collection on TV template). */
export async function getTvPageDataTailTv(
  input: MoviePageDetailTailInput
): Promise<MoviePageDetailTailPatch> {
  const id = input.mediaId
  if (!Number.isFinite(id) || id <= 0) {
    return { similar: [], collection: null, backdropGallery: [] }
  }
  try {
    const [similarPage, imagesPayload] = await Promise.all([
      tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
        `/tv/${id}/similar`,
        { page: '1' },
        { revalidate: TMDB_REVALIDATE_MODERATE }
      ).catch(() => null),
      tmdbFetch<{
        backdrops?: Array<{
          file_path: string
          vote_average: number
          width?: number
          height?: number
        }>
      }>(`/tv/${id}/images`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
      }).catch(() => null),
    ])

    const backdrops: MovieBackdropStill[] = (imagesPayload?.backdrops ?? [])
      .sort((a, b) => b.vote_average - a.vote_average)
      .map((b) => ({
        filePath: b.file_path,
        width: typeof b.width === 'number' && b.width > 0 ? b.width : 1280,
        height: typeof b.height === 'number' && b.height > 0 ? b.height : 720,
      }))

    const currentGenreIds = new Set(
      input.genreIds.filter((gid): gid is number => typeof gid === 'number' && Number.isFinite(gid))
    )
    const currentYear = input.releaseYear

    const discoverSimilarRaw =
      Number.isFinite(currentYear) && currentGenreIds.size > 0
        ? await fetchDiscoverTvByGenresAndYears(
            [...currentGenreIds],
            [currentYear as number, (currentYear as number) - 1],
            id,
            TMDB_REVALIDATE_MODERATE
          )
        : []

    const combinedSimilarRaw: TmdbRawMedia[] = (() => {
      const out: TmdbRawMedia[] = []
      const seen = new Set<number>()
      for (const m of [...(similarPage?.results ?? []), ...discoverSimilarRaw]) {
        if (!m?.id || m.id === id || seen.has(m.id)) continue
        seen.add(m.id)
        out.push(m)
      }
      return out
    })()

    const relevantSimilarRaw = pickRelevantSimilarItems(
      combinedSimilarRaw,
      currentGenreIds,
      Number.isFinite(currentYear) ? currentYear : null,
      16
    )
    const similarBase = relevantSimilarRaw.map(mapRawToCardItem)
    const similar = await enrichTvPageCardItemsWithDetails(similarBase, TMDB_REVALIDATE_MODERATE)

    return { similar, collection: null, backdropGallery: backdrops }
  } catch {
    return { similar: [], collection: null, backdropGallery: [] }
  }
}

function mapRawToCardItem(m: TmdbRawMedia): MoviePageCardItem {
  const title = (m.title ?? m.name ?? 'Untitled').trim() || 'Untitled'
  return {
    id: m.id,
    title,
    posterPath: m.poster_path ?? null,
    releaseDate: m.release_date ?? m.first_air_date ?? null,
    voteAverage: m.vote_average ?? 0,
    genres: labelsFromGenreIds(m.genre_ids).slice(0, 2),
    runtimeMinutes: null,
  }
}

function parseReleaseYearFromRawMedia(m: TmdbRawMedia): number | null {
  const dateStr = m.release_date ?? m.first_air_date ?? ''
  if (!dateStr || dateStr.length < 4) return null
  const y = Number(dateStr.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function parseReleaseIsoFromRawMedia(m: TmdbRawMedia): string | null {
  const dateStr = (m.release_date ?? m.first_air_date ?? '').trim()
  const hit = /^(\d{4}-\d{2}-\d{2})/.exec(dateStr)
  return hit?.[1] ?? null
}

function scoreSimilarCandidate(
  c: {
    overlap: number
    year: number | null
    voteAverage: number
    voteCount: number
    popularity: number
  },
  currentYear: number | null
): number {
  const overlapBoost = c.overlap * 4.2
  const ratingBoost = Math.max(0, Math.min(10, c.voteAverage)) * 0.9
  const votesBoost = Math.log10(c.voteCount + 1) * 1.15
  const popBoost = Math.min(1200, Math.max(0, c.popularity)) / 260
  const recencyBoost =
    currentYear != null && c.year != null
      ? Math.max(0, 14 - Math.abs(c.year - currentYear)) * 0.34
      : 1
  return overlapBoost + ratingBoost + votesBoost + popBoost + recencyBoost
}

function pickRelevantSimilarItems(
  rawItems: TmdbRawMedia[],
  currentGenreIds: Set<number>,
  currentYear: number | null,
  limit: number
): TmdbRawMedia[] {
  if (!rawItems.length || limit <= 0) return []

  const ranked = rawItems.map((m) => {
    const genreIds = m.genre_ids ?? []
    const overlap = currentGenreIds.size
      ? genreIds.filter((id) => currentGenreIds.has(id)).length
      : 0
    const year = parseReleaseYearFromRawMedia(m)
    const releaseIso = parseReleaseIsoFromRawMedia(m)
    return {
      raw: m,
      overlap,
      year,
      releaseIso,
      isAnimation: genreIds.includes(16),
      isTvMovie: genreIds.includes(TV_MOVIE_GENRE_ID),
      voteAverage: m.vote_average ?? 0,
      voteCount: m.vote_count ?? 0,
      popularity: m.popularity ?? 0,
    }
  })

  let pool = ranked
  const todayIso = new Date().toISOString().slice(0, 10)
  const currentIsAnimation = currentGenreIds.has(16)

  // 1) Hard remove unreleased / TV Movie / animation mismatch.
  pool = pool.filter((c) => {
    if (c.releaseIso == null || c.releaseIso > todayIso) return false
    if (c.isTvMovie) return false
    if (!currentIsAnimation && c.isAnimation) return false
    return true
  })

  // 2) Keep only titles that match original movie genres.
  if (currentGenreIds.size > 0) {
    pool = pool.filter((c) => c.overlap >= 1)
  }

  // 3) Two-stage year strategy:
  // strict: current year + previous year
  if (currentYear != null) {
    const strictYears = new Set([currentYear, currentYear - 1])
    pool = pool.filter((c) => c.year != null && strictYears.has(c.year))
  }

  // 4) Light quality floor to cut obvious low-signal noise.
  const qualityPool = pool.filter((c) => c.voteAverage >= 5.2 && c.voteCount >= 25)
  if (qualityPool.length >= Math.min(limit, 6)) {
    pool = qualityPool
  }

  pool.sort((a, b) => scoreSimilarCandidate(b, currentYear) - scoreSimilarCandidate(a, currentYear))

  return pool.slice(0, limit).map((c) => c.raw)
}

async function fetchDiscoverMoviesByGenresAndYears(
  genreIds: number[],
  years: number[],
  excludeMovieId: number,
  revalidate = TMDB_REVALIDATE_MODERATE
): Promise<TmdbRawMedia[]> {
  if (!genreIds.length || !years.length) return []

  const withGenres = genreIds.join('|')
  const jobs: Array<Promise<TmdbDiscoverPage<TmdbRawMedia> | null>> = []

  for (const y of years) {
    for (const p of [1, 2, 3] as const) {
      jobs.push(
        tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(
          '/discover/movie',
          {
            include_adult: 'false',
            include_video: 'false',
            language: 'en-US',
            with_genres: withGenres,
            primary_release_year: String(y),
            sort_by: 'vote_count.desc',
            'vote_count.gte': '20',
            page: String(p),
          },
          { revalidate }
        ).catch(() => null)
      )
    }
  }

  const pages = await Promise.all(jobs)
  const out: TmdbRawMedia[] = []
  const seen = new Set<number>()

  for (const page of pages) {
    for (const m of page?.results ?? []) {
      if (!m?.id || m.id === excludeMovieId || seen.has(m.id)) continue
      seen.add(m.id)
      out.push(m)
    }
  }

  return out
}

async function fetchDiscoverTvByGenresAndYears(
  genreIds: number[],
  years: number[],
  excludeTvId: number,
  revalidate = TMDB_REVALIDATE_MODERATE
): Promise<TmdbRawMedia[]> {
  if (!genreIds.length || !years.length) return []

  const withGenres = genreIds.join('|')
  const jobs: Array<Promise<TmdbDiscoverPage<TmdbRawMedia> | null>> = []

  for (const y of years) {
    for (const p of [1, 2, 3] as const) {
      jobs.push(
        tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(
          '/discover/tv',
          {
            include_adult: 'false',
            language: 'en-US',
            with_genres: withGenres,
            first_air_date_year: String(y),
            sort_by: 'vote_count.desc',
            'vote_count.gte': '20',
            page: String(p),
          },
          { revalidate }
        ).catch(() => null)
      )
    }
  }

  const pages = await Promise.all(jobs)
  const out: TmdbRawMedia[] = []
  const seen = new Set<number>()

  for (const page of pages) {
    for (const m of page?.results ?? []) {
      if (!m?.id || m.id === excludeTvId || seen.has(m.id)) continue
      seen.add(m.id)
      out.push(m)
    }
  }

  return out
}

async function enrichMoviePageCardItemsWithDetails(
  items: MoviePageCardItem[],
  revalidate = TMDB_REVALIDATE_MODERATE
): Promise<MoviePageCardItem[]> {
  const chunkSize = 6
  const out: MoviePageCardItem[] = []

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const enriched = await Promise.all(
      chunk.map(async (item) => {
        try {
          const d = await tmdbFetch<{
            runtime?: number | null
            genres?: { name: string }[]
          }>(`/movie/${item.id}`, undefined, { revalidate })

          const detailGenres = (d.genres ?? [])
            .map((g) => g.name?.trim() ?? '')
            .filter(Boolean)
            .slice(0, 2)
          const fallbackGenres = Array.isArray(item.genres) ? item.genres : []
          const genres = detailGenres.length > 0 ? detailGenres : fallbackGenres
          const runtimeMinutes =
            d.runtime != null && d.runtime > 0
              ? Math.round(d.runtime)
              : (item.runtimeMinutes ?? null)

          return { ...item, genres, runtimeMinutes }
        } catch {
          return item
        }
      })
    )
    out.push(...enriched)
  }

  return out
}

async function enrichTvPageCardItemsWithDetails(
  items: MoviePageCardItem[],
  revalidate = TMDB_REVALIDATE_MODERATE
): Promise<MoviePageCardItem[]> {
  const chunkSize = 6
  const out: MoviePageCardItem[] = []

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const enriched = await Promise.all(
      chunk.map(async (item) => {
        try {
          const d = await tmdbFetch<{
            episode_run_time?: number[]
            last_episode_to_run?: {
              runtime?: number | null
              season_number?: number
              episode_number?: number
            }
            genres?: { name: string }[]
          }>(`/tv/${item.id}`, undefined, { revalidate })

          const rt = await tvRuntimeWithEpisodeFallback(item.id, d, revalidate)
          const detailGenres = (d.genres ?? [])
            .map((g) => g.name?.trim() ?? '')
            .filter(Boolean)
            .slice(0, 2)
          const fallbackGenres = Array.isArray(item.genres) ? item.genres : []
          const genres = detailGenres.length > 0 ? detailGenres : fallbackGenres
          const runtimeMinutes = rt ?? item.runtimeMinutes ?? null

          return { ...item, genres, runtimeMinutes }
        } catch {
          return item
        }
      })
    )
    out.push(...enriched)
  }

  return out
}

function buildWatchRows(us: TmdbWatchCountry | undefined): MovieWatchProviderRow[] {
  if (!us) return []
  const rows: MovieWatchProviderRow[] = []
  for (const p of us.flatrate ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Stream',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  for (const p of us.free ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Free',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  for (const p of us.rent ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Rent',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  for (const p of us.buy ?? []) {
    rows.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      type: 'Buy',
      quality: PROVIDER_QUALITY[p.provider_id] ?? 'HD',
    })
  }
  return rows.slice(0, 8)
}

function mapProviderRef(p: TmdbWatchProviderRef): MovieWatchProviderItem {
  return {
    providerId: p.provider_id,
    providerName: p.provider_name,
    logoPath: p.logo_path ?? null,
  }
}

function buildWatchProvidersUs(us: TmdbWatchCountry | undefined): MovieWatchProvidersUs | null {
  if (!us) return null
  const seen = new Set<number>()
  const stream: MovieWatchProviderItem[] = []
  for (const p of [...(us.flatrate ?? []), ...(us.free ?? [])]) {
    if (seen.has(p.provider_id)) continue
    seen.add(p.provider_id)
    stream.push(mapProviderRef(p))
  }
  const rent = (us.rent ?? []).map(mapProviderRef)
  const buy = (us.buy ?? []).map(mapProviderRef)
  const hasAny = stream.length > 0 || rent.length > 0 || buy.length > 0
  if (!hasAny) return null
  return {
    link: us.link?.trim() ? us.link.trim() : null,
    stream,
    rent,
    buy,
  }
}

type TmdbReleaseDatesPayload = {
  results?: Array<{ iso_3166_1: string; release_dates: Array<{ certification: string }> }>
} | null

function pickReleaseCertification(data: TmdbReleaseDatesPayload, iso3166: string): string | null {
  if (!data?.results?.length) return null
  const row = data.results.find((r) => r.iso_3166_1?.toUpperCase() === iso3166.toUpperCase())
  if (!row?.release_dates?.length) return null
  const rd = row.release_dates.find((x) => x.certification?.trim()) ?? row.release_dates[0]
  return rd?.certification?.trim() || null
}

/**
 * TMDB per-country `certification` is inconsistent: RU/GB are often plain digits ("18", "12");
 * US uses MPA letters. Prefer numeric territories, then map US letters to minimum-age style "N+".
 */
function formatMovieAgeRatingBadge(data: TmdbReleaseDatesPayload): string | null {
  const numericCountries = ['RU', 'BY', 'KZ', 'UA', 'GB'] as const
  for (const iso of numericCountries) {
    const raw = pickReleaseCertification(data, iso)
    if (raw && /^\d{1,2}$/.test(raw)) return `${raw}+`
  }

  const us = pickReleaseCertification(data, 'US')
  if (!us) return null

  const key = us.toUpperCase().replace(/\s+/g, '-')
  const mpaToMinAge: Record<string, number> = {
    G: 0,
    PG: 10,
    'PG-13': 13,
    R: 17,
    'NC-17': 18,
    'TV-Y': 0,
    'TV-Y7': 7,
    'TV-G': 0,
    'TV-PG': 10,
    'TV-14': 14,
    'TV-MA': 18,
  }
  const skip = new Set(['NR', 'NOT-RATED', 'NOTRATED', 'UR', ''])

  if (skip.has(key)) return null
  const age = mpaToMinAge[key]
  if (typeof age === 'number') return `${age}+`

  return null
}

type TmdbTvContentRatingsPayload = {
  results?: Array<{ iso_3166_1?: string; rating?: string }>
} | null

function formatTvContentRatingBadge(data: TmdbTvContentRatingsPayload): string | null {
  if (!data?.results?.length) return null
  const us = data.results.find((r) => (r.iso_3166_1 ?? '').toUpperCase() === 'US')?.rating?.trim()
  if (us) return us
  const gb = data.results.find((r) => (r.iso_3166_1 ?? '').toUpperCase() === 'GB')?.rating?.trim()
  if (gb) return gb
  const fallbackRating = data.results.find((r) => r.rating?.trim())?.rating?.trim()
  return fallbackRating ?? null
}

const ALT_TITLE_COUNTRY_ORDER = ['US', 'GB', 'AU', 'CA', 'IE', 'NZ'] as const

/** Prefer English-market alternate titles when the main tagline / original are Cyrillic. */
function pickAlternateDisplayTitle(
  titles: Array<{ iso_3166_1?: string; title?: string }> | undefined,
  mainTitle: string,
  originalTitle: string
): string | null {
  const mainL = mainTitle.trim().toLowerCase()
  const origL = originalTitle.trim().toLowerCase()
  const origIsLatin = Boolean(originalTitle.trim()) && !containsCyrillic(originalTitle)
  const seen = new Set<string>()

  const take = (raw: string | undefined | null): string | null => {
    const s = raw?.trim()
    if (!s || containsCyrillic(s)) return null
    const sl = s.toLowerCase()
    if (sl === mainL) return null
    if (origIsLatin && sl === origL) return null
    if (seen.has(sl)) return null
    seen.add(sl)
    return s
  }

  const rows = titles?.filter((t) => t.title?.trim()) ?? []

  for (const iso of ALT_TITLE_COUNTRY_ORDER) {
    const u = iso.toUpperCase()
    for (const t of rows) {
      if ((t.iso_3166_1 ?? '').toUpperCase() !== u) continue
      const hit = take(t.title)
      if (hit) return hit
    }
  }
  for (const t of rows) {
    const hit = take(t.title)
    if (hit) return hit
  }
  return null
}

/** Movie detail without gallery / similar / collection parts — faster shell for streaming + metadata. */
export async function getMoviePageDataShell(id: number): Promise<MoviePageDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  try {
    const movieTag = cacheTagMovie(id)
    const d = await tmdbFetch<{
      id: number
      title?: string
      original_title?: string
      tagline?: string | null
      overview?: string | null
      release_date?: string
      runtime?: number | null
      poster_path?: string | null
      backdrop_path?: string | null
      vote_average?: number
      vote_count?: number
      genres?: { id: number; name: string }[]
      homepage?: string | null
      imdb_id?: string | null
      budget?: number
      revenue?: number
      status?: string | null
      original_language?: string | null
      production_countries?: { iso_3166_1: string; name: string }[]
      production_companies?: { id: number; name: string }[]
      belongs_to_collection?: { id: number; name: string } | null
      credits?: {
        cast: Array<{
          id: number
          name: string
          character?: string
          profile_path: string | null
          order: number
        }>
        crew: Array<{ id: number; name: string; job: string }>
      }
    }>(
      `/movie/${id}`,
      { append_to_response: 'credits', language: 'en-US' },
      {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [movieTag, CACHE_TAG_MOVIES],
      }
    )

    const origLang = d.original_language?.trim().toLowerCase() ?? ''
    const fetchOrigVideos = origLang.length > 0 && origLang !== 'en' && origLang !== 'en-us'

    const rawImdbId = d.imdb_id?.trim() ? d.imdb_id.trim() : null

    const [
      providersPayload,
      releasePayload,
      altTitlesPayload,
      videosEnUs,
      videosOriginalLang,
      imagesPayload,
    ] = await Promise.all([
      tmdbFetch<TmdbWatchProvidersPayload>(`/movie/${id}/watch/providers`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [movieTag, CACHE_TAG_MOVIES],
      }).catch(() => null),
      tmdbFetch<TmdbReleaseDatesPayload>(`/movie/${id}/release_dates`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [movieTag, CACHE_TAG_MOVIES],
      }).catch(() => null),
      tmdbFetch<{ titles?: Array<{ iso_3166_1: string; title: string }> }>(
        `/movie/${id}/alternative_titles`,
        undefined,
        { revalidate: TMDB_REVALIDATE_MODERATE, tags: [movieTag, CACHE_TAG_MOVIES] }
      ).catch(() => null),
      tmdbFetch<TmdbVideosResponse>(
        `/movie/${id}/videos`,
        { language: 'en-US' },
        {
          revalidate: TMDB_REVALIDATE_MODERATE,
          tags: [movieTag, CACHE_TAG_MOVIES],
        }
      ).catch(() => ({ results: [] as TmdbVideosResponse['results'] })),
      fetchOrigVideos
        ? tmdbFetch<TmdbVideosResponse>(
            `/movie/${id}/videos`,
            { language: d.original_language!.trim() },
            { revalidate: TMDB_REVALIDATE_MODERATE, tags: [movieTag, CACHE_TAG_MOVIES] }
          ).catch(() => ({ results: [] as TmdbVideosResponse['results'] }))
        : Promise.resolve({ results: [] as TmdbVideosResponse['results'] }),
      tmdbFetch<{ backdrops?: TmdbBackdropImageRow[] }>(`/movie/${id}/images`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [movieTag, CACHE_TAG_MOVIES],
      }).catch(() => null),
    ])

    const crew = d.credits?.crew ?? []
    const director = crew.find((c) => c.job === 'Director' && c.name?.trim()) ?? null
    const directorRef: MoviePageCrewRef | null = director
      ? { id: director.id, name: director.name.trim() }
      : null

    const directorNames: string[] = []
    const directorSeen = new Set<string>()
    for (const c of crew) {
      if (c.job !== 'Director') continue
      const n = c.name?.trim()
      if (!n || directorSeen.has(n)) continue
      directorSeen.add(n)
      directorNames.push(n)
    }

    const writerSeen = new Set<number>()
    const writers: MoviePageCrewRef[] = []
    for (const c of crew) {
      if (c.job !== 'Screenplay' && c.job !== 'Writer') continue
      if (writerSeen.has(c.id)) continue
      writerSeen.add(c.id)
      const n = c.name?.trim()
      if (n) writers.push({ id: c.id, name: n })
      if (writers.length >= 3) break
    }

    const castRaw = [...(d.credits?.cast ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    const cast: MoviePageCastMember[] = castRaw.map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character?.trim() ? c.character : null,
      profilePath: c.profile_path,
    }))
    const starsForMeta: MoviePageCrewRef[] = castRaw.slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
    }))

    const us = providersPayload?.results?.US
    const watchProvidersUs = buildWatchProvidersUs(us)
    const watchRows = buildWatchRows(us)
    const streamingNames = [
      ...(us?.flatrate ?? []).map((p) => p.provider_name),
      ...(us?.free ?? []).map((p) => p.provider_name),
    ]
    const justWatchLink = us?.link?.trim() ? us.link.trim() : null
    const watchNowProvider = us?.flatrate?.[0] ?? us?.free?.[0] ?? null
    const titleForWatch = d.title?.trim() || 'Untitled'
    const watchNowUrl = watchNowProvider
      ? buildWatchNowUrl(watchNowProvider.provider_id, titleForWatch, justWatchLink ?? '#')
      : null
    const watchNowLogoUrl = watchNowProvider?.logo_path
      ? getImageUrl(watchNowProvider.logo_path, 'w92')
      : null

    const mergedVideos = mergeTmdbMovieVideoResults(videosEnUs.results, videosOriginalLang.results)
    const primary = pickPrimaryYoutubeVideo(mergedVideos)

    const belongsToCollectionMeta =
      d.belongs_to_collection?.id != null
        ? {
            id: d.belongs_to_collection.id,
            name: d.belongs_to_collection.name?.trim() || 'Collection',
          }
        : null

    const heroBackdropStills = pickHeroBackdropStillsForShell(
      imagesPayload?.backdrops,
      d.backdrop_path
    )

    const originalForAlt = d.original_title?.trim() || titleForWatch
    const alternateDisplayTitle = pickAlternateDisplayTitle(
      altTitlesPayload?.titles,
      titleForWatch,
      originalForAlt
    )

    return {
      id: d.id,
      title: titleForWatch,
      originalTitle: d.original_title?.trim() || titleForWatch,
      tagline: d.tagline?.trim() ? d.tagline.trim() : null,
      overview: typeof d.overview === 'string' ? d.overview : '',
      releaseDate: d.release_date?.trim() ? d.release_date : null,
      runtime: d.runtime != null && d.runtime > 0 ? Math.round(d.runtime) : null,
      posterPath: d.poster_path ?? null,
      backdropPath: d.backdrop_path ?? null,
      voteAverage: d.vote_average ?? 0,
      voteCount: d.vote_count ?? 0,
      genres: (d.genres ?? [])
        .filter((g) => g.name?.trim())
        .map((g) => ({ id: g.id, name: g.name.trim() })),
      homepage: d.homepage?.trim() ? d.homepage.trim() : null,
      imdbId: rawImdbId,
      budget: typeof d.budget === 'number' && d.budget > 0 ? d.budget : 0,
      revenue: typeof d.revenue === 'number' && d.revenue > 0 ? d.revenue : 0,
      status: d.status?.trim() ? d.status.trim() : null,
      originalLanguage: d.original_language?.trim() ? d.original_language.trim() : null,
      productionCountries: (d.production_countries ?? []).map((c) => ({
        iso: c.iso_3166_1,
        name: c.name,
      })),
      productionCompanies: (d.production_companies ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      director: directorRef,
      directorNames,
      writers,
      starsForMeta,
      cast,
      trailerYoutubeKey: primary?.key ?? null,
      trailer: primary,
      ageRatingBadge: formatMovieAgeRatingBadge(releasePayload),
      justWatchLink,
      watchRows,
      streamingNames,
      watchNowUrl,
      watchNowLogoUrl,
      watchNowProviderName: watchNowProvider?.provider_name ?? null,
      similar: [],
      collection: null,
      backdropGallery: [],
      heroBackdropStills,
      watchProvidersUs,
      alternateDisplayTitle,
      belongsToCollectionMeta,
    }
  } catch {
    return null
  }
}

/** TV detail shell — no similar/images tail (streams in `MovieDetailStreamedBelowFold`). */
export async function getTvPageDataShell(id: number): Promise<MoviePageDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  try {
    const tvTag = cacheTagTv(id)
    const d = await tmdbFetch<{
      id: number
      name?: string
      original_name?: string
      tagline?: string | null
      overview?: string | null
      first_air_date?: string
      poster_path?: string | null
      backdrop_path?: string | null
      vote_average?: number
      vote_count?: number
      genres?: { id: number; name: string }[]
      homepage?: string | null
      status?: string | null
      original_language?: string | null
      production_countries?: { iso_3166_1: string; name: string }[]
      production_companies?: { id: number; name: string }[]
      episode_run_time?: number[]
      created_by?: Array<{ id: number; name: string }>
      last_episode_to_run?: {
        runtime?: number | null
        season_number?: number
        episode_number?: number
      }
      credits?: {
        cast: Array<{
          id: number
          name: string
          character?: string
          profile_path: string | null
          order: number
        }>
        crew: Array<{ id: number; name: string; job: string }>
      }
      external_ids?: { imdb_id?: string | null }
      seasons?: Array<{
        season_number?: number
        name?: string
        episode_count?: number
        air_date?: string | null
      }>
    }>(
      `/tv/${id}`,
      { append_to_response: 'credits,external_ids', language: 'en-US' },
      {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [tvTag],
      }
    )

    let rawImdbId = d.external_ids?.imdb_id?.trim() ? d.external_ids.imdb_id.trim() : null
    if (rawImdbId && /^\d+$/.test(rawImdbId)) rawImdbId = `tt${rawImdbId}`

    const origLang = d.original_language?.trim().toLowerCase() ?? ''
    const fetchOrigVideos = origLang.length > 0 && origLang !== 'en' && origLang !== 'en-us'

    const titleForWatch = d.name?.trim() || 'Untitled'

    const [
      providersPayload,
      contentRatingsPayload,
      altTitlesPayload,
      videosEnUs,
      videosOriginalLang,
      tvImagesPayload,
    ] = await Promise.all([
      tmdbFetch<TmdbWatchProvidersPayload>(`/tv/${id}/watch/providers`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [tvTag],
      }).catch(() => null),
      tmdbFetch<TmdbTvContentRatingsPayload>(`/tv/${id}/content_ratings`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [tvTag],
      }).catch(() => null),
      tmdbFetch<{ titles?: Array<{ iso_3166_1: string; title: string }> }>(
        `/tv/${id}/alternative_titles`,
        undefined,
        { revalidate: TMDB_REVALIDATE_MODERATE, tags: [tvTag] }
      ).catch(() => null),
      tmdbFetch<TmdbVideosResponse>(
        `/tv/${id}/videos`,
        { language: 'en-US' },
        {
          revalidate: TMDB_REVALIDATE_MODERATE,
          tags: [tvTag],
        }
      ).catch(() => ({ results: [] as TmdbVideosResponse['results'] })),
      fetchOrigVideos
        ? tmdbFetch<TmdbVideosResponse>(
            `/tv/${id}/videos`,
            { language: d.original_language!.trim() },
            { revalidate: TMDB_REVALIDATE_MODERATE, tags: [tvTag] }
          ).catch(() => ({ results: [] as TmdbVideosResponse['results'] }))
        : Promise.resolve({ results: [] as TmdbVideosResponse['results'] }),
      tmdbFetch<{ backdrops?: TmdbBackdropImageRow[] }>(`/tv/${id}/images`, undefined, {
        revalidate: TMDB_REVALIDATE_MODERATE,
        tags: [tvTag],
      }).catch(() => null),
    ])

    const crew = d.credits?.crew ?? []
    const crewDirector = crew.find((c) => c.job === 'Director' && c.name?.trim()) ?? null
    const created = d.created_by ?? []
    const directorRef: MoviePageCrewRef | null = crewDirector
      ? { id: crewDirector.id, name: crewDirector.name.trim() }
      : created[0]?.name?.trim()
        ? { id: created[0].id, name: created[0].name.trim() }
        : null

    const directorNames: string[] = []
    const directorSeen = new Set<string>()
    for (const c of crew) {
      if (c.job !== 'Director') continue
      const n = c.name?.trim()
      if (!n || directorSeen.has(n)) continue
      directorSeen.add(n)
      directorNames.push(n)
    }
    for (const cb of created) {
      const n = cb.name?.trim()
      if (!n || directorSeen.has(n)) continue
      directorSeen.add(n)
      directorNames.push(n)
    }

    const writerSeen = new Set<number>()
    const writers: MoviePageCrewRef[] = []
    for (const c of crew) {
      if (c.job !== 'Screenplay' && c.job !== 'Writer') continue
      if (writerSeen.has(c.id)) continue
      writerSeen.add(c.id)
      const n = c.name?.trim()
      if (n) writers.push({ id: c.id, name: n })
      if (writers.length >= 3) break
    }

    const castRaw = [...(d.credits?.cast ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    const cast: MoviePageCastMember[] = castRaw.map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character?.trim() ? c.character : null,
      profilePath: c.profile_path,
    }))
    const starsForMeta: MoviePageCrewRef[] = castRaw.slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
    }))

    const us = providersPayload?.results?.US
    const watchProvidersUs = buildWatchProvidersUs(us)
    const watchRows = buildWatchRows(us)
    const streamingNames = [
      ...(us?.flatrate ?? []).map((p) => p.provider_name),
      ...(us?.free ?? []).map((p) => p.provider_name),
    ]
    const justWatchLink = us?.link?.trim() ? us.link.trim() : null
    const watchNowProvider = us?.flatrate?.[0] ?? us?.free?.[0] ?? null
    const watchNowUrl = watchNowProvider
      ? buildWatchNowUrl(watchNowProvider.provider_id, titleForWatch, justWatchLink ?? '#')
      : null
    const watchNowLogoUrl = watchNowProvider?.logo_path
      ? getImageUrl(watchNowProvider.logo_path, 'w92')
      : null

    const mergedVideos = mergeTmdbMovieVideoResults(videosEnUs.results, videosOriginalLang.results)
    const primary = pickPrimaryYoutubeVideo(mergedVideos)

    const originalForAlt = d.original_name?.trim() || titleForWatch
    const alternateDisplayTitle = pickAlternateDisplayTitle(
      altTitlesPayload?.titles,
      titleForWatch,
      originalForAlt
    )

    const runtime = await tvRuntimeWithEpisodeFallback(id, d, TMDB_REVALIDATE_MODERATE)

    const tvSeasonSummaries = (d.seasons ?? [])
      .filter(
        (
          s
        ): s is {
          season_number: number
          name?: string
          episode_count?: number
          air_date?: string | null
        } => typeof s?.season_number === 'number' && s.season_number > 0
      )
      .map((s) => ({
        seasonNumber: s.season_number,
        name: (() => {
          const raw = s.name?.trim() ?? ''
          const fallback = `Season ${s.season_number}`
          if (!raw || raw.toLowerCase() === fallback.toLowerCase()) return fallback
          return raw
        })(),
        episodeCount: typeof s.episode_count === 'number' ? s.episode_count : 0,
        airDate: s.air_date?.trim() ? s.air_date.trim() : null,
      }))
      .slice(0, 50)

    const heroBackdropStills = pickHeroBackdropStillsForShell(
      tvImagesPayload?.backdrops,
      d.backdrop_path
    )

    return {
      id: d.id,
      title: titleForWatch,
      originalTitle: d.original_name?.trim() || titleForWatch,
      tagline: d.tagline?.trim() ? d.tagline.trim() : null,
      overview: typeof d.overview === 'string' ? d.overview : '',
      releaseDate: d.first_air_date?.trim() ? d.first_air_date : null,
      runtime,
      posterPath: d.poster_path ?? null,
      backdropPath: d.backdrop_path ?? null,
      voteAverage: d.vote_average ?? 0,
      voteCount: d.vote_count ?? 0,
      genres: (d.genres ?? [])
        .filter((g) => g.name?.trim())
        .map((g) => ({ id: g.id, name: g.name.trim() })),
      homepage: d.homepage?.trim() ? d.homepage.trim() : null,
      imdbId: rawImdbId,
      budget: 0,
      revenue: 0,
      status: d.status?.trim() ? d.status.trim() : null,
      originalLanguage: d.original_language?.trim() ? d.original_language.trim() : null,
      productionCountries: (d.production_countries ?? []).map((c) => ({
        iso: c.iso_3166_1,
        name: c.name,
      })),
      productionCompanies: (d.production_companies ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      director: directorRef,
      directorNames,
      writers,
      starsForMeta,
      cast,
      trailerYoutubeKey: primary?.key ?? null,
      trailer: primary,
      ageRatingBadge: formatTvContentRatingBadge(contentRatingsPayload),
      justWatchLink,
      watchRows,
      streamingNames,
      watchNowUrl,
      watchNowLogoUrl,
      watchNowProviderName: watchNowProvider?.provider_name ?? null,
      similar: [],
      collection: null,
      backdropGallery: [],
      heroBackdropStills,
      watchProvidersUs,
      alternateDisplayTitle,
      tvSeasonSummaries,
    }
  } catch {
    return null
  }
}

/** Target count for hero; fewer may be returned if the catalog year is thin (no throw). */
const HERO_MOVIE_COUNT = 10
/** Safety cap — TMDB discover pages are 20 items; 25 pages is plenty for picks after filters. */
const HERO_DISCOVER_MAX_PAGES = 25
/** Hero carousel is fixed to this theatrical year (wide-release blockbusters only). */
const HERO_PRIMARY_RELEASE_YEAR = 2026

/** Hero: release date within [YYYY-01-01, endIso] (end caps at year-end or today). */
function heroReleaseInYearWindow(iso: string | undefined, year: number, endIso: string): boolean {
  if (!iso || iso.length < 10) return false
  const d = iso.slice(0, 10)
  return d >= `${year}-01-01` && d <= endIso
}

/** Same vote/popularity ladder as `passesExpectedMonthBlockbusterRaw` — no low-signal titles in the cover carousel. */
function passesHeroBlockbusterMovie(m: TmdbRawMedia): boolean {
  if (!m.backdrop_path || !m.poster_path) return false
  if (isCombatSportsOrWrestlingProgram(m)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) return false
  if (m.genre_ids?.some((id) => HERO_EXCLUDE.has(id))) return false
  const v = m.vote_count ?? 0
  const p = m.popularity ?? 0
  if (p >= 48) return true
  if (v >= 280) return true
  if (v >= 200 && p >= 30) return true
  if (v >= 140 && p >= 38) return true
  if (v >= 95 && p >= 42) return true
  return false
}

// ── Homepage fetchers ────────────────────────────────────

export async function getHeroItems(): Promise<HeroItem[]> {
  const year = HERO_PRIMARY_RELEASE_YEAR
  const today = new Date().toISOString().slice(0, 10)
  const yearEnd = `${year}-12-31`
  const endIso = today <= yearEnd ? today : yearEnd

  const filterHero = (items: TmdbRawMedia[]) =>
    items.filter(
      (m) => heroReleaseInYearWindow(m.release_date, year, endIso) && passesHeroBlockbusterMovie(m)
    )

  const picked: TmdbRawMedia[] = []
  const seen = new Set<number>()
  let page = 1
  let totalPages = 1

  try {
    while (
      picked.length < HERO_MOVIE_COUNT &&
      page <= totalPages &&
      page <= HERO_DISCOVER_MAX_PAGES
    ) {
      const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(
        '/discover/movie',
        {
          primary_release_year: String(year),
          'primary_release_date.gte': `${year}-01-01`,
          'primary_release_date.lte': endIso,
          sort_by: 'primary_release_date.desc',
          'vote_count.gte': '120',
          without_genres: SHELF_EXCLUDE,
          page: String(page),
        },
        { revalidate: TMDB_REVALIDATE_FAST }
      )
      totalPages = Math.max(1, res.total_pages)

      for (const m of filterHero(res.results)) {
        if (picked.length >= HERO_MOVIE_COUNT) break
        if (seen.has(m.id)) continue
        seen.add(m.id)
        picked.push(m)
      }
      page++
    }
  } catch {
    /* Auth/network/TMDB errors — leave picked as-is; trending fallback below may recover. */
  }

  /**
   * Curated year-window discover can legitimately return zero rows (TMDB catalog gaps,
   * strict blockbuster gate, transient API errors). Trending week keeps the homepage hero
   * from disappearing entirely.
   */
  if (picked.length === 0) {
    try {
      const trending = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
        '/trending/movie/week',
        {},
        { revalidate: TMDB_REVALIDATE_FAST, tags: [CACHE_TAG_TRENDING] }
      )
      for (const m of trending.results) {
        if (picked.length >= HERO_MOVIE_COUNT) break
        if (!m.backdrop_path?.trim() || !m.poster_path) continue
        if (isCombatSportsOrWrestlingProgram(m)) continue
        if (!passesShelfGenreFilter(m)) continue
        if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) continue
        if (seen.has(m.id)) continue
        seen.add(m.id)
        picked.push(m)
      }
    } catch {
      /* keep picked empty — caller treats [] as no hero */
    }
  }

  if (picked.length === 0) {
    return []
  }

  const candidates = picked.slice(0, Math.min(HERO_MOVIE_COUNT, picked.length))

  const listGenreLabels = (raw: TmdbRawMedia) =>
    (raw.genre_ids ?? []).map((id) => GENRE_NAMES[id]).filter(Boolean) as string[]

  const results = await Promise.all(
    candidates.map(async (m) => {
      const dateStr = m.release_date || m.first_air_date || ''
      const listLabels = listGenreLabels(m)
      try {
        const d = await tmdbFetch<{
          runtime?: number | null
          genres?: { name: string }[]
          videos?: TmdbVideosResponse
        }>(`/movie/${m.id}`, { append_to_response: 'videos' }, { revalidate: TMDB_REVALIDATE_FAST })
        const detailNames = (d.genres ?? []).map((g) => g.name)
        const genres = mergeUpToTwoGenres(detailNames, listLabels)
        const runtime = d.runtime != null && d.runtime > 0 ? d.runtime : null
        const trailerKey = pickTrailerKeyFromResults(d.videos?.results)
        return {
          id: m.id,
          type: 'movie' as const,
          title: m.title ?? m.name ?? 'Untitled',
          overview: m.overview ?? '',
          backdropPath: m.backdrop_path!,
          voteAverage: m.vote_average,
          releaseDate: dateStr ? new Date(dateStr) : new Date(),
          genres,
          runtime,
          trailerKey,
        } satisfies HeroItem
      } catch {
        return {
          id: m.id,
          type: 'movie' as const,
          title: m.title ?? m.name ?? 'Untitled',
          overview: m.overview ?? '',
          backdropPath: m.backdrop_path!,
          voteAverage: m.vote_average,
          releaseDate: dateStr ? new Date(dateStr) : new Date(),
          genres: mergeUpToTwoGenres([], listLabels),
          runtime: null,
          trailerKey: null,
        } satisfies HeroItem
      }
    })
  )

  return results
}

export async function getBestOf2026(): Promise<ShelfItem[]> {
  const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
    '/discover/movie',
    {
      primary_release_year: '2026',
      /** TMDB popularity — aligns with mainstream / studio buzz, not niche high-rating titles. */
      sort_by: 'popularity.desc',
      /** Cuts obscure listings; major releases accumulate votes early. */
      'vote_count.gte': '120',
      without_genres: SHELF_EXCLUDE,
    },
    { revalidate: TMDB_REVALIDATE_MODERATE, tags: [CACHE_TAG_HOME_MODERATE] }
  )
  const items = res.results.slice(0, 20).map((m) => mapToShelfItem(m, 'movie'))
  return enrichShelfItemsWithDetails(items, TMDB_REVALIDATE_MODERATE)
}

export async function getTrendingNow(): Promise<ShelfItem[]> {
  const todayIso = new Date().toISOString().slice(0, 10)
  const collected: TmdbRawMedia[] = []
  const seen = new Set<number>()
  const maxPages = 6
  for (let page = 1; page <= maxPages && collected.length < 20; page += 1) {
    const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
      '/trending/movie/day',
      { page: String(page) },
      { revalidate: TMDB_REVALIDATE_FAST, tags: [CACHE_TAG_TRENDING] }
    )
    for (const row of res.results) {
      if (collected.length >= 20) break
      if (seen.has(row.id)) continue
      if (!isMainstreamTrendingMovie(row, todayIso)) continue
      seen.add(row.id)
      collected.push(row)
    }
  }
  const items = applyTrendingRecencyBias(collected, todayIso)
    .slice(0, 20)
    .map((m) => mapToShelfItem(m, 'movie'))
  return enrichShelfItemsWithDetails(items, TMDB_REVALIDATE_FAST)
}

export async function getNewReleases(): Promise<ShelfItem[]> {
  const today = new Date().toISOString().slice(0, 10)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [moviesRes, tvRes] = await Promise.all([
    tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
      '/discover/movie',
      {
        'primary_release_date.gte': twoWeeksAgo,
        'primary_release_date.lte': today,
        sort_by: 'popularity.desc',
        'vote_count.gte': '5',
        without_genres: SHELF_EXCLUDE,
      },
      { revalidate: TMDB_REVALIDATE_FAST, tags: [CACHE_TAG_TRENDING] }
    ),
    tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
      '/discover/tv',
      {
        'first_air_date.gte': twoWeeksAgo,
        'first_air_date.lte': today,
        sort_by: 'popularity.desc',
        'vote_count.gte': '5',
        /** Scripted drama + miniseries — fiction TV only (no documentary / news / reality / talk). */
        with_type: '2|4',
        without_genres: SHELF_EXCLUDE,
      },
      { revalidate: TMDB_REVALIDATE_FAST, tags: [CACHE_TAG_TRENDING] }
    ),
  ])
  const items = [
    ...moviesRes.results.filter(isNewThisWeekMovie).map((m) => mapToShelfItem(m, 'movie')),
    ...tvRes.results.filter(isNewThisWeekSeries).map((m) => mapToShelfItem(m, 'series')),
  ]
    .sort((a, b) => (b.releaseDate?.getTime() ?? 0) - (a.releaseDate?.getTime() ?? 0))
    .slice(0, 20)
  return enrichShelfItemsWithDetails(items, TMDB_REVALIDATE_FAST)
}

/** Extra gate for softer TMDB passes — keeps the shelf “well-rated”, not random discover tail. */
function passesAcclaimedRecentSoft(m: TmdbRawMedia): boolean {
  const v = m.vote_count ?? 0
  const r = m.vote_average ?? 0
  const p = m.popularity ?? 0
  if (r >= 7 && v >= 120) return true
  if (r >= 6.8 && v >= 180) return true
  if (r >= 6.6 && v >= 140 && p >= 18) return true
  if (r >= 6.5 && v >= 220) return true
  return false
}

/** Last-resort fill so the homepage rail can still reach `MIN_ACCLAIMED_HOME` titles. */
function passesAcclaimedRecentEmergency(m: TmdbRawMedia): boolean {
  const v = m.vote_count ?? 0
  const r = m.vote_average ?? 0
  const p = m.popularity ?? 0
  if (r >= 6.4 && v >= 90 && p >= 14) return true
  if (r >= 6.2 && v >= 120 && p >= 10) return true
  return false
}

const ACCLAIMED_JUNK_RE = new RegExp(
  [
    'behind the scenes',
    'making of',
    'featurette',
    '\\brecap\\b',
    'highlights',
    'official trailer',
    'teaser trailer',
    'fan edit',
    'fanedit',
    '\\bcompilation\\b',
    'from the vault',
    'anniversary edition',
    "collector's edition",
    'double feature',
    'triple feature',
  ].join('|'),
  'i'
)

function isAcclaimedRecentJunk(m: TmdbRawMedia): boolean {
  const blob = [m.title, m.original_title, m.overview]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join('\n')
  return ACCLAIMED_JUNK_RE.test(blob)
}

/** Sort key: rating × log votes + mild popularity (higher is better). */
function acclaimedRecentQualityScore(m: TmdbRawMedia): number {
  const v = Math.log10((m.vote_count ?? 0) + 1)
  const r = m.vote_average ?? 0
  const p = Math.log1p(m.popularity ?? 0)
  let s = r * v * 1.45 + p * 0.38
  if (m.backdrop_path != null && m.backdrop_path !== '') s += 0.15
  return s
}

const ACCLAIMED_STRICT_HEAD = 8
const ACCLAIMED_SOFT_MAX_WHEN_STRICT_FULL = 2
const MIN_ACCLAIMED_HOME = 10

type AcclaimedPhase = {
  dateGte: string
  voteGte: string
  ratingGte: string
  sortBy: string
  maxPages: number
  soft: boolean
}

async function runAcclaimedPhases(
  today: string,
  phases: AcclaimedPhase[],
  consider: (m: TmdbRawMedia, soft: boolean) => void,
  revalidate: number
): Promise<void> {
  for (const ph of phases) {
    for (let page = 1; page <= ph.maxPages; page += 1) {
      const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(
        '/discover/movie',
        {
          'primary_release_date.gte': ph.dateGte,
          'primary_release_date.lte': today,
          sort_by: ph.sortBy,
          'vote_count.gte': ph.voteGte,
          'vote_average.gte': ph.ratingGte,
          without_genres: SHELF_EXCLUDE,
          page: String(page),
        },
        { revalidate }
      )
      for (const m of res.results) consider(m, ph.soft)
      const lastPage = Math.min(ph.maxPages, Math.max(1, res.total_pages))
      if (page >= lastPage) break
    }
  }
}

function mergeAcclaimedPools(
  strictPool: TmdbRawMedia[],
  softPool: TmdbRawMedia[],
  cap: number
): TmdbRawMedia[] {
  const sortDesc = (a: TmdbRawMedia, b: TmdbRawMedia) =>
    acclaimedRecentQualityScore(b) - acclaimedRecentQualityScore(a)
  const strict = [...strictPool].sort(sortDesc)
  const soft = [...softPool].sort(sortDesc)
  const out: TmdbRawMedia[] = []
  const outIds = new Set<number>()

  const push = (m: TmdbRawMedia) => {
    if (outIds.has(m.id)) return
    out.push(m)
    outIds.add(m.id)
  }

  const headStrict = Math.min(ACCLAIMED_STRICT_HEAD, cap, strict.length)
  for (let i = 0; i < headStrict; i += 1) push(strict[i]!)

  if (out.length >= ACCLAIMED_STRICT_HEAD) {
    let softAdded = 0
    for (const m of soft) {
      if (out.length >= cap) break
      if (softAdded >= ACCLAIMED_SOFT_MAX_WHEN_STRICT_FULL) break
      push(m)
      softAdded += 1
    }
  } else {
    for (const m of soft) {
      if (out.length >= cap) break
      push(m)
      if (out.length >= MIN_ACCLAIMED_HOME) break
    }
  }

  for (let i = headStrict; i < strict.length; i += 1) {
    if (out.length >= cap) break
    push(strict[i]!)
  }
  for (const m of soft) {
    if (out.length >= cap) break
    push(m)
  }

  return out.slice(0, cap)
}

/**
 * Homepage: **movies only** — recent releases, strong scores; junk stripped; **8 strict + 2 soft** in the
 * first ten when possible, then tail fill so the row can reach `limit` without disappearing.
 */
export async function getAcclaimedRecentMovies(limit = 20): Promise<ShelfItem[]> {
  const today = new Date().toISOString().slice(0, 10)
  const d = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const cap = Math.min(Math.max(1, limit), 20)

  const strictById = new Map<number, TmdbRawMedia>()
  const softById = new Map<number, TmdbRawMedia>()

  const baseOk = (m: TmdbRawMedia) =>
    isNewThisWeekMovie(m) &&
    m.poster_path != null &&
    m.poster_path !== '' &&
    !isAcclaimedRecentJunk(m)

  const consider = (m: TmdbRawMedia, soft: boolean) => {
    if (!baseOk(m)) return
    if (soft && !passesAcclaimedRecentSoft(m)) return
    if (!soft) {
      strictById.set(m.id, m)
      softById.delete(m.id)
    } else if (!strictById.has(m.id)) {
      softById.set(m.id, m)
    }
  }

  const mainPhases: AcclaimedPhase[] = [
    {
      dateGte: d(90),
      voteGte: '200',
      ratingGte: '7',
      sortBy: 'vote_average.desc',
      maxPages: 12,
      soft: false,
    },
    {
      dateGte: d(120),
      voteGte: '180',
      ratingGte: '6.9',
      sortBy: 'vote_average.desc',
      maxPages: 10,
      soft: false,
    },
    {
      dateGte: d(90),
      voteGte: '120',
      ratingGte: '6.7',
      sortBy: 'vote_average.desc',
      maxPages: 10,
      soft: true,
    },
    {
      dateGte: d(120),
      voteGte: '100',
      ratingGte: '6.5',
      sortBy: 'popularity.desc',
      maxPages: 10,
      soft: true,
    },
  ]

  await runAcclaimedPhases(today, mainPhases, consider, TMDB_REVALIDATE_MODERATE)

  let merged = mergeAcclaimedPools([...strictById.values()], [...softById.values()], cap)

  if (merged.length < Math.min(MIN_ACCLAIMED_HOME, cap)) {
    const emergency: AcclaimedPhase[] = [
      {
        dateGte: d(150),
        voteGte: '80',
        ratingGte: '6.2',
        sortBy: 'popularity.desc',
        maxPages: 8,
        soft: true,
      },
    ]
    const strictBefore = new Set(merged.map((m) => m.id))
    await runAcclaimedPhases(
      today,
      emergency,
      (m) => {
        if (!baseOk(m) || strictBefore.has(m.id)) return
        if (!passesAcclaimedRecentEmergency(m)) return
        if (!strictById.has(m.id)) softById.set(m.id, m)
      },
      TMDB_REVALIDATE_MODERATE
    )
    merged = mergeAcclaimedPools([...strictById.values()], [...softById.values()], cap)
  }

  const items = merged.map((m) => mapToShelfItem(m, 'movie'))
  return enrichShelfItemsWithDetails(items, TMDB_REVALIDATE_MODERATE)
}

export async function getBestMoviesAllTime(): Promise<ShelfItem[]> {
  const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>('/movie/top_rated', undefined, {
    revalidate: TMDB_REVALIDATE_ALL_TIME,
    tags: [CACHE_TAG_ALL_TIME],
  })
  const items = res.results.slice(0, 20).map((m) => mapToShelfItem(m, 'movie'))
  return enrichShelfItemsWithDetails(items, TMDB_REVALIDATE_ALL_TIME)
}

export async function getBestSeriesAllTime(): Promise<ShelfItem[]> {
  const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
    '/discover/tv',
    {
      sort_by: 'vote_average.desc',
      'vote_count.gte': '200',
      with_type: '4',
      without_genres: SHELF_EXCLUDE,
    },
    { revalidate: TMDB_REVALIDATE_ALL_TIME, tags: [CACHE_TAG_ALL_TIME] }
  )
  const items = res.results
    .filter((m) => m.vote_average >= 8.0)
    .slice(0, 20)
    .map((m) => mapToShelfItem(m, 'series'))
  return enrichShelfItemsWithDetails(items, TMDB_REVALIDATE_ALL_TIME)
}

// ── Popular people (homepage actor rail) ────────────────

interface TmdbRawPerson {
  id: number
  name: string
  popularity: number
  profile_path: string | null
  known_for_department?: string | null
}

export interface PopularActorItem {
  id: number
  name: string
  profilePath: string | null
  popularity: number
  department: string | null
}

/**
 * TMDB `/person/popular` — 20 per page. Merges pages 1–5, dedupes by id, sorts by popularity, caps at `limit`.
 */
export async function getPopularActors(limit = 100): Promise<PopularActorItem[]> {
  const pageResponses = await Promise.all(
    [1, 2, 3, 4, 5].map((page) =>
      tmdbFetch<TmdbDiscoverPage<TmdbRawPerson>>(
        '/person/popular',
        {
          page: String(page),
          language: 'en-US',
        },
        { revalidate: TMDB_REVALIDATE_PEOPLE, tags: [CACHE_TAG_PEOPLE] }
      ).catch(
        (): TmdbDiscoverPage<TmdbRawPerson> => ({
          results: [],
          page,
          total_pages: 0,
          total_results: 0,
        })
      )
    )
  )

  const seen = new Set<number>()
  const merged: TmdbRawPerson[] = []
  for (const res of pageResponses) {
    for (const p of res.results) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      merged.push(p)
    }
  }

  merged.sort((a, b) => b.popularity - a.popularity)

  return merged.slice(0, limit).map((p) => ({
    id: p.id,
    name: p.name,
    profilePath: p.profile_path,
    popularity: p.popularity,
    department: p.known_for_department ?? null,
  }))
}

export interface PersonPageDetail {
  id: number
  name: string
  biography: string
  knownForDepartment: string | null
  alsoKnownAs: string[]
  gender: number | null
  popularity: number | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  profilePath: string | null
  homepage: string | null
  imdbId: string | null
  facebookId: string | null
  instagramId: string | null
  xId: string | null
  tiktokId: string | null
  youtubeId: string | null
}

export async function getPersonPageData(id: number): Promise<PersonPageDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  try {
    const personTag = cacheTagPerson(id)
    const d = await tmdbFetch<{
      id: number
      name?: string
      biography?: string | null
      known_for_department?: string | null
      also_known_as?: string[] | null
      gender?: number | null
      popularity?: number | null
      birthday?: string | null
      deathday?: string | null
      place_of_birth?: string | null
      profile_path?: string | null
      homepage?: string | null
      external_ids?: {
        imdb_id?: string | null
        facebook_id?: string | null
        instagram_id?: string | null
        twitter_id?: string | null
        tiktok_id?: string | null
        youtube_id?: string | null
      }
    }>(
      `/person/${id}`,
      { append_to_response: 'external_ids', language: 'en-US' },
      { revalidate: TMDB_REVALIDATE_PEOPLE, tags: [personTag] }
    )
    const name = d.name?.trim() ? d.name.trim() : `Person ${d.id}`
    const imdbRaw = d.external_ids?.imdb_id?.trim() ? d.external_ids.imdb_id.trim() : null
    const facebookRaw = d.external_ids?.facebook_id?.trim()
      ? d.external_ids.facebook_id.trim()
      : null
    const instagramRaw = d.external_ids?.instagram_id?.trim()
      ? d.external_ids.instagram_id.trim()
      : null
    const xRaw = d.external_ids?.twitter_id?.trim() ? d.external_ids.twitter_id.trim() : null
    const tiktokRaw = d.external_ids?.tiktok_id?.trim() ? d.external_ids.tiktok_id.trim() : null
    const youtubeRaw = d.external_ids?.youtube_id?.trim() ? d.external_ids.youtube_id.trim() : null
    return {
      id: d.id,
      name,
      biography: (d.biography ?? '').trim(),
      knownForDepartment: d.known_for_department?.trim() || null,
      alsoKnownAs: (d.also_known_as ?? []).map((item) => item.trim()).filter(Boolean),
      gender: Number.isFinite(d.gender) ? (d.gender ?? null) : null,
      popularity: Number.isFinite(d.popularity) ? (d.popularity ?? null) : null,
      birthday: d.birthday?.trim() || null,
      deathday: d.deathday?.trim() || null,
      placeOfBirth: d.place_of_birth?.trim() || null,
      profilePath: d.profile_path?.trim() ? d.profile_path : null,
      homepage: d.homepage?.trim() || null,
      imdbId: imdbRaw,
      facebookId: facebookRaw,
      instagramId: instagramRaw,
      xId: xRaw,
      tiktokId: tiktokRaw,
      youtubeId: youtubeRaw,
    }
  } catch {
    return null
  }
}

export interface PersonCreditRowRaw {
  kind: 'movie' | 'tv'
  workId: number
  title: string
  character: string | null
  releaseDate: string | null
  popularity: number
  posterPath: string | null
  genreIds: number[]
}

export interface PersonImageRow {
  filePath: string
  width: number
  height: number
  voteAverage: number
  voteCount: number
}

/** Profile photos from TMDB person images endpoint. */
export async function getPersonImages(personId: number): Promise<PersonImageRow[]> {
  if (!Number.isFinite(personId) || personId <= 0) return []
  try {
    const personTag = cacheTagPerson(personId)
    const d = await tmdbFetch<{
      profiles?: Array<{
        file_path?: string | null
        width?: number
        height?: number
        vote_average?: number
        vote_count?: number
      }>
    }>(`/person/${personId}/images`, undefined, {
      revalidate: TMDB_REVALIDATE_PEOPLE,
      tags: [personTag],
    })

    const rows: PersonImageRow[] = []
    for (const row of d.profiles ?? []) {
      const filePath = row.file_path?.trim() ?? ''
      if (!filePath) continue
      const width = Number.isFinite(row.width) ? Number(row.width) : 0
      const height = Number.isFinite(row.height) ? Number(row.height) : 0
      if (width <= 0 || height <= 0) continue
      rows.push({
        filePath,
        width,
        height,
        voteAverage: typeof row.vote_average === 'number' ? row.vote_average : 0,
        voteCount: typeof row.vote_count === 'number' ? row.vote_count : 0,
      })
    }

    const unique = new Map<string, PersonImageRow>()
    for (const row of rows) {
      unique.set(row.filePath, row)
    }
    return [...unique.values()].sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
      if (b.voteAverage !== a.voteAverage) return b.voteAverage - a.voteAverage
      return b.width * b.height - a.width * a.height
    })
  } catch {
    return []
  }
}

/** Cast credits from TMDB (sorted by popularity, capped). Paths are built in `@/lib/personCredits`. */
export async function getPersonCombinedCredits(personId: number): Promise<PersonCreditRowRaw[]> {
  if (!Number.isFinite(personId) || personId <= 0) return []
  try {
    const personTag = cacheTagPerson(personId)
    const d = await tmdbFetch<{
      cast?: Array<{
        id: number
        title?: string
        name?: string
        character?: string
        release_date?: string | null
        first_air_date?: string | null
        media_type?: string
        popularity?: number
        poster_path?: string | null
        genre_ids?: number[]
      }>
    }>(
      `/person/${personId}/combined_credits`,
      { language: 'en-US' },
      { revalidate: TMDB_REVALIDATE_PEOPLE, tags: [personTag] }
    )

    const rows: PersonCreditRowRaw[] = []
    for (const c of d.cast ?? []) {
      if (c.media_type !== 'movie' && c.media_type !== 'tv') continue
      const title = (c.media_type === 'movie' ? c.title : c.name)?.trim() ?? ''
      if (!title) continue
      const releaseDate =
        c.media_type === 'movie' ? c.release_date?.trim() || null : c.first_air_date?.trim() || null
      const kind = c.media_type
      rows.push({
        kind,
        workId: c.id,
        title,
        character: c.character?.trim() || null,
        releaseDate,
        popularity: typeof c.popularity === 'number' ? c.popularity : 0,
        posterPath: c.poster_path?.trim() || null,
        genreIds: Array.isArray(c.genre_ids)
          ? c.genre_ids.filter((item): item is number => Number.isFinite(item))
          : [],
      })
    }
    rows.sort((a, b) => b.popularity - a.popularity)
    return rows.slice(0, 72)
  } catch {
    return []
  }
}

/** Trending people for sitemap union (dedupe with popular pool by id). */
export async function getTrendingPeopleForSitemap(limit = 48): Promise<PopularActorItem[]> {
  if (!getTmdbApiKey()) return []
  try {
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawPerson>>(
      '/trending/person/week',
      { language: 'en-US' },
      { revalidate: TMDB_REVALIDATE_PEOPLE }
    )
    return res.results.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      profilePath: p.profile_path,
      popularity: p.popularity,
      department: p.known_for_department ?? null,
    }))
  } catch {
    return []
  }
}

// ── Movies discover browse (`/movies` + TMDB discover + `/api/discover`) ──

export interface TmdbGenreListItem {
  id: number
  name: string
}

export async function getMovieGenresList(): Promise<TmdbGenreListItem[]> {
  const data = await tmdbFetch<{ genres: TmdbGenreListItem[] }>('/genre/movie/list')
  return data.genres
}

export interface WatchProviderListItem {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

export interface TmdbStudioListItem {
  id: number
  name: string
}

const STUDIOS_CACHE_TTL_MS = 6 * 60 * 60 * 1000
let studiosCache: { at: number; items: TmdbStudioListItem[] } | null = null

type YearFeedStats = { at: number; totalPages: number; totalResults: number }
const YEAR_FEED_STATS_TTL_MS = 60 * 60 * 1000
const yearFeedStatsCache = new Map<number, YearFeedStats>()
const tvYearFeedStatsCache = new Map<number, YearFeedStats>()
const movieRuntimeMinutesCache = new Map<number, number | null>()

interface WatchProvidersRegionBuckets {
  flatrate?: WatchProviderListItem[]
  rent?: WatchProviderListItem[]
  buy?: WatchProviderListItem[]
}

/** Flatten US streaming/rent/buy rows for filter UI (TMDB nests by region). */
export async function getWatchProvidersMovieList(): Promise<WatchProviderListItem[]> {
  const data = await tmdbFetch<{ results: unknown }>('/watch/providers/movie', {
    watch_region: 'US',
  })

  // TMDB list endpoint returns `{ results: WatchProviderListItem[] }`.
  if (Array.isArray(data.results)) {
    return data.results
      .filter(
        (p): p is WatchProviderListItem =>
          p != null &&
          typeof p === 'object' &&
          'provider_id' in p &&
          'provider_name' in p &&
          typeof (p as { provider_id: unknown }).provider_id === 'number' &&
          typeof (p as { provider_name: unknown }).provider_name === 'string'
      )
      .slice(0, 50)
  }

  // Backward-compatible fallback if server/proxy ever returns region buckets.
  if (data.results != null && typeof data.results === 'object') {
    const us = (data.results as Record<string, WatchProvidersRegionBuckets>)['US']
    if (!us) return []
    const merged: WatchProviderListItem[] = []
    const seen = new Set<number>()
    for (const bucket of [us.flatrate, us.rent, us.buy]) {
      for (const p of bucket ?? []) {
        if (seen.has(p.provider_id)) continue
        seen.add(p.provider_id)
        merged.push(p)
      }
    }
    return merged.slice(0, 50)
  }

  return []
}

export async function getWatchProvidersTvList(): Promise<WatchProviderListItem[]> {
  const data = await tmdbFetch<{ results: unknown }>('/watch/providers/tv', { watch_region: 'US' })
  if (Array.isArray(data.results)) {
    return data.results
      .filter(
        (p): p is WatchProviderListItem =>
          p != null &&
          typeof p === 'object' &&
          'provider_id' in p &&
          'provider_name' in p &&
          typeof (p as { provider_id: unknown }).provider_id === 'number' &&
          typeof (p as { provider_name: unknown }).provider_name === 'string'
      )
      .slice(0, 50)
  }
  if (data.results != null && typeof data.results === 'object') {
    const us = (data.results as Record<string, WatchProvidersRegionBuckets>)['US']
    if (!us) return []
    const merged: WatchProviderListItem[] = []
    const seen = new Set<number>()
    for (const bucket of [us.flatrate, us.rent, us.buy]) {
      for (const p of bucket ?? []) {
        if (seen.has(p.provider_id)) continue
        seen.add(p.provider_id)
        merged.push(p)
      }
    }
    return merged.slice(0, 50)
  }
  return []
}

/**
 * Build a practical studio list for filter UI by sampling popular movie details.
 * TMDB has no simple "top studios" endpoint for discover filters.
 */
export async function getMovieStudiosList(limit = 40): Promise<TmdbStudioListItem[]> {
  if (studiosCache != null && Date.now() - studiosCache.at < STUDIOS_CACHE_TTL_MS) {
    return studiosCache.items.slice(0, limit)
  }

  const sample = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
    sort_by: 'popularity.desc',
    page: '1',
    'vote_count.gte': '200',
    without_genres: '16',
  })

  const top = sample.results.slice(0, 24)
  const bucket = new Map<number, { id: number; name: string; count: number }>()

  const chunkSize = 8
  for (let i = 0; i < top.length; i += chunkSize) {
    const chunk = top.slice(i, i + chunkSize)
    const details = await Promise.all(
      chunk.map((m) =>
        tmdbFetch<{ production_companies?: Array<{ id: number; name: string }> }>(
          `/movie/${m.id}`
        ).catch((): { production_companies: Array<{ id: number; name: string }> } => ({
          production_companies: [],
        }))
      )
    )
    for (const d of details) {
      for (const c of d.production_companies ?? []) {
        const name = c.name.trim()
        if (!name) continue
        const prev = bucket.get(c.id)
        if (prev) {
          prev.count += 1
        } else {
          bucket.set(c.id, { id: c.id, name, count: 1 })
        }
      }
    }
  }

  const items = [...bucket.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ id, name }) => ({ id, name }))

  studiosCache = { at: Date.now(), items }
  return items
}

export async function getTvGenresList(): Promise<TmdbGenreListItem[]> {
  const data = await tmdbFetch<{ genres: TmdbGenreListItem[] }>('/genre/tv/list')
  return data.genres
}

export async function getSeriesStudiosList(limit = 40): Promise<TmdbStudioListItem[]> {
  const sample = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
    sort_by: 'popularity.desc',
    page: '1',
    'vote_count.gte': '100',
    without_genres: '16',
  })
  const top = sample.results.slice(0, 24)
  const bucket = new Map<number, { id: number; name: string; count: number }>()
  const chunkSize = 8

  for (let i = 0; i < top.length; i += chunkSize) {
    const chunk = top.slice(i, i + chunkSize)
    const details = await Promise.all(
      chunk.map((m) =>
        tmdbFetch<{
          networks?: Array<{ id: number; name: string }>
          production_companies?: Array<{ id: number; name: string }>
        }>(`/tv/${m.id}`).catch(
          (): {
            networks: Array<{ id: number; name: string }>
            production_companies: Array<{ id: number; name: string }>
          } => ({ networks: [], production_companies: [] })
        )
      )
    )
    for (const d of details) {
      for (const c of [...(d.networks ?? []), ...(d.production_companies ?? [])]) {
        const name = c.name.trim()
        if (!name) continue
        const prev = bucket.get(c.id)
        if (prev) prev.count += 1
        else bucket.set(c.id, { id: c.id, name, count: 1 })
      }
    }
  }

  return [...bucket.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ id, name }) => ({ id, name }))
}

/** Normalized `/movies` discover state (shared by page, metadata, and `/api/discover`). */
export interface MoviesDiscoverState {
  genre?: string
  year?: string
  /** Raw `sort` query: `trending`, `top`, or a TMDB `sort_by` value. */
  sortParam: string
  provider?: string
  studio?: string
  rating?: string
  language?: string
  country?: string
  runtime?: string
  comingYear?: number
  /** Calendar month spotlight (`/movies?expected=YYYY-MM`). */
  expectedYear?: number
  expectedMonth?: number
  browseMode: 'discover' | 'trending'
  /** TMDB `sort_by` when `browseMode === 'discover'` and not `comingYear`. */
  sortBy: string
  voteCountGte: string
}

const DISCOVER_SORT_WHITELIST = new Set([
  'popularity.desc',
  'popularity.asc',
  'release_date.desc',
  'release_date.asc',
  'vote_average.desc',
  'vote_average.asc',
  'original_title.asc',
  'revenue.desc',
])

function clampBrowseYear(raw: string, fallback: number): number {
  const y = Number.parseInt(raw, 10)
  if (!Number.isFinite(y)) return fallback
  return Math.min(2035, Math.max(1950, y))
}

function qp(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key]
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : v
}

function sanitizeDiscoverSortParam(raw: string | undefined): string {
  if (raw == null || raw === '') return 'popularity.desc'
  const s = raw.trim()
  if (s.toLowerCase() === 'trending') return 'trending'
  if (s.toLowerCase() === 'top') return 'top'
  if (DISCOVER_SORT_WHITELIST.has(s)) return s
  return 'popularity.desc'
}

/** Parse `searchParams` for `/movies` discover + legacy browse links (`sort`, `year`, `coming`). */
export function parseMoviesDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): MoviesDiscoverState {
  const nowYear = new Date().getFullYear()
  let expectedParsed = parseExpectedMonthParam(qp(sp, 'expected'))
  if (expectedParsed == null) {
    const mAlt = sanitizeCalendarMonth(qp(sp, 'month'))
    const yForExpected = qp(sp, 'year')
    if (mAlt != null && yForExpected != null && yForExpected !== '') {
      expectedParsed = { y: clampBrowseYear(yForExpected, nowYear), m: mAlt }
    }
  }

  const comingRaw = qp(sp, 'coming')
  const comingYear =
    expectedParsed != null
      ? undefined
      : comingRaw != null && comingRaw !== ''
        ? clampBrowseYear(comingRaw, nowYear)
        : undefined

  const genre = sanitizeDigitsId(qp(sp, 'genre'))
  const yearRaw = qp(sp, 'year')
  const year =
    expectedParsed != null || comingYear != null
      ? undefined
      : yearRaw != null && yearRaw !== ''
        ? String(clampBrowseYear(yearRaw, nowYear))
        : undefined

  const provider = sanitizeDigitsId(qp(sp, 'provider'))
  const studio = sanitizeDigitsId(qp(sp, 'studio'))
  const rating = sanitizeVoteAverageGte(qp(sp, 'rating'))
  const language = sanitizeIso639(qp(sp, 'language'))
  const country = sanitizeIso3166(qp(sp, 'country'))
  const runtime = sanitizeRuntimeBucket(qp(sp, 'runtime'))

  const sortParam = sanitizeDiscoverSortParam(qp(sp, 'sort'))
  let browseMode: 'discover' | 'trending' = 'discover'
  let sortBy = 'popularity.desc'
  let voteCountGte = '5'

  if (sortParam === 'trending') {
    browseMode = 'trending'
  } else if (sortParam === 'top') {
    sortBy = 'vote_average.desc'
    voteCountGte = '200'
  } else {
    sortBy = sortParam
  }

  if (comingYear != null || expectedParsed != null) {
    voteCountGte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
  }

  const out: MoviesDiscoverState = {
    sortParam,
    browseMode,
    sortBy,
    voteCountGte,
  }
  if (genre != null) out.genre = genre
  if (year != null) out.year = year
  if (provider != null) out.provider = provider
  if (studio != null) out.studio = studio
  if (rating != null) out.rating = rating
  if (language != null) out.language = language
  if (country != null) out.country = country
  if (runtime != null) out.runtime = runtime
  if (comingYear != null) out.comingYear = comingYear
  if (expectedParsed != null) {
    out.expectedYear = expectedParsed.y
    out.expectedMonth = expectedParsed.m
  }
  return out
}

function sanitizeDigitsId(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  if (!/^\d+$/.test(raw)) return undefined
  return raw
}

function sanitizeVoteAverageGte(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n < 0 || n > 10) return undefined
  return String(n)
}

function sanitizeIso639(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(s)) return undefined
  return s
}

function sanitizeIso3166(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(s)) return undefined
  return s
}

const RUNTIME_BUCKETS = new Set([
  '0-25',
  '25-45',
  '45-60',
  '60-999',
  '0-90',
  '90-120',
  '120-150',
  '150-999',
])

function sanitizeRuntimeBucket(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim()
  if (!RUNTIME_BUCKETS.has(s)) return undefined
  return s
}

function parseExpectedMonthParam(raw: string | undefined): { y: number; m: number } | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim()
  if (!/^\d{4}-\d{2}$/.test(s)) return undefined
  const [ys, ms] = s.split('-')
  const y = Number(ys)
  const m = Number(ms)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return undefined
  return { y, m }
}

function sanitizeCalendarMonth(raw: string | undefined): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1 || n > 12) return undefined
  return n
}

/** Labels for duplicate-content / metadata (order stable). */
export function moviesDiscoverActiveFilterKeys(state: MoviesDiscoverState): string[] {
  const keys: string[] = []
  if (state.genre) keys.push('genre')
  if (state.year) keys.push('year')
  if (state.sortParam !== 'popularity.desc') keys.push('sort')
  if (state.provider) keys.push('provider')
  if (state.studio) keys.push('studio')
  if (state.rating) keys.push('rating')
  if (state.language) keys.push('language')
  if (state.country) keys.push('country')
  if (state.runtime) keys.push('runtime')
  if (state.comingYear != null) keys.push('coming')
  if (state.expectedYear != null && state.expectedMonth != null) keys.push('expected')
  return keys
}

/** Same shape as `moviesDiscoverActiveFilterKeys` for `/series` (no expected-month facet). */
export function seriesDiscoverActiveFilterKeys(state: SeriesDiscoverState): string[] {
  const keys: string[] = []
  if (state.genre) keys.push('genre')
  if (state.year) keys.push('year')
  if (state.sortParam !== 'popularity.desc') keys.push('sort')
  if (state.provider) keys.push('provider')
  if (state.studio) keys.push('studio')
  if (state.rating) keys.push('rating')
  if (state.language) keys.push('language')
  if (state.country) keys.push('country')
  if (state.runtime) keys.push('runtime')
  if (state.comingYear != null) keys.push('coming')
  return keys
}

interface DiscoverMoviesBrowseInput {
  genre?: string
  year?: string
  primary_release_date_gte?: string
  primary_release_date_lte?: string
  sort_by: string
  page: number
  with_watch_providers?: string
  with_companies?: string
  with_origin_country?: string
  with_runtime_gte?: string
  with_runtime_lte?: string
  vote_count_gte: string
  vote_average_gte?: string
  with_original_language?: string
  without_genres: string
}

export async function discoverMoviesBrowse(
  input: DiscoverMoviesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  const rankByHypeDesc = (rows: TmdbRawMedia[]): TmdbRawMedia[] =>
    [...rows].sort((a, b) => {
      const byPopularity = b.popularity - a.popularity
      if (byPopularity !== 0) return byPopularity
      const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
      if (byVotes !== 0) return byVotes
      return b.vote_average - a.vote_average
    })

  const rankByYearThenHypeDesc = (rows: TmdbRawMedia[]): TmdbRawMedia[] =>
    [...rows].sort((a, b) => {
      const yearA = Number.parseInt((a.release_date ?? '').slice(0, 4), 10)
      const yearB = Number.parseInt((b.release_date ?? '').slice(0, 4), 10)
      const safeYearA = Number.isFinite(yearA) ? yearA : 0
      const safeYearB = Number.isFinite(yearB) ? yearB : 0
      const byYear = safeYearB - safeYearA
      if (byYear !== 0) return byYear
      const byPopularity = b.popularity - a.popularity
      if (byPopularity !== 0) return byPopularity
      const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
      if (byVotes !== 0) return byVotes
      return b.vote_average - a.vote_average
    })

  const sortPageByHype = (
    pageData: TmdbDiscoverPage<TmdbRawMedia>
  ): TmdbDiscoverPage<TmdbRawMedia> => ({
    ...pageData,
    results: rankByHypeDesc(pageData.results),
  })

  const sortPageByYearThenHype = (
    pageData: TmdbDiscoverPage<TmdbRawMedia>
  ): TmdbDiscoverPage<TmdbRawMedia> => ({
    ...pageData,
    results: rankByYearThenHypeDesc(pageData.results),
  })

  const parsedLteYear = Number.parseInt((input.primary_release_date_lte ?? '').slice(0, 4), 10)
  const parsedGteYear = Number.parseInt((input.primary_release_date_gte ?? '').slice(0, 4), 10)
  const yearBucketCurrentYear = Number.isFinite(parsedLteYear)
    ? parsedLteYear
    : new Date().getFullYear()
  const yearBucketMinYear = Number.isFinite(parsedGteYear) ? parsedGteYear : 1900

  const getYearFeedStats = async (year: number): Promise<YearFeedStats> => {
    const cached = yearFeedStatsCache.get(year)
    if (cached != null && Date.now() - cached.at < YEAR_FEED_STATS_TTL_MS) return cached
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
      primary_release_year: String(year),
      sort_by: 'popularity.desc',
      'vote_count.gte': '0',
      without_genres: input.without_genres,
      ...(input.genre != null ? { with_genres: input.genre } : {}),
      ...(input.primary_release_date_lte != null && year === yearBucketCurrentYear
        ? { 'primary_release_date.lte': input.primary_release_date_lte }
        : {}),
      ...(input.primary_release_date_gte != null && year === yearBucketMinYear
        ? { 'primary_release_date.gte': input.primary_release_date_gte }
        : {}),
      page: '1',
    })
    const stats: YearFeedStats = {
      at: Date.now(),
      totalPages: Math.max(0, Math.min(500, res.total_pages)),
      totalResults: Math.max(0, res.total_results),
    }
    yearFeedStatsCache.set(year, stats)
    return stats
  }

  const discoverYearBucketFeed = async (
    globalPage: number
  ): Promise<TmdbDiscoverPage<TmdbRawMedia>> => {
    let remaining = globalPage
    const currentYear = yearBucketCurrentYear
    const minYear = yearBucketMinYear
    const upperDate = input.primary_release_date_lte
    const lowerDate = input.primary_release_date_gte
    let knownResults = 0

    for (let year = currentYear; year >= minYear; year -= 1) {
      const stats = await getYearFeedStats(year)
      knownResults += stats.totalResults
      if (stats.totalPages === 0) continue
      if (remaining > stats.totalPages) {
        remaining -= stats.totalPages
        continue
      }

      const pageData = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
        primary_release_year: String(year),
        sort_by: 'popularity.desc',
        'vote_count.gte': '0',
        without_genres: input.without_genres,
        ...(input.genre != null ? { with_genres: input.genre } : {}),
        ...(upperDate != null && year === currentYear
          ? { 'primary_release_date.lte': upperDate }
          : {}),
        ...(lowerDate != null && year === minYear ? { 'primary_release_date.gte': lowerDate } : {}),
        page: String(remaining),
      })
      return {
        ...pageData,
        page: globalPage,
        total_pages: 50000,
        total_results: knownResults,
        results: rankByHypeDesc(pageData.results),
      }
    }

    return {
      page: globalPage,
      total_pages: globalPage,
      total_results: knownResults,
      results: [],
    }
  }

  const page = Math.min(500, Math.max(1, input.page))
  if (
    input.primary_release_date_gte != null &&
    input.primary_release_date_lte != null &&
    comingYear == null
  ) {
    const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
      'primary_release_date.gte': input.primary_release_date_gte,
      'primary_release_date.lte': input.primary_release_date_lte,
      sort_by: 'primary_release_date.asc',
      'vote_count.gte': input.vote_count_gte,
      without_genres: input.without_genres,
      ...(input.genre != null ? { with_genres: input.genre } : {}),
      page: String(page),
    })
    const sorted = sortDiscoverPageByReleaseAsc(data)
    return {
      ...sorted,
      results: sorted.results.filter(passesComingDiscoverSoftQuality),
    }
  }
  if (comingYear != null) {
    const today = new Date().toISOString().slice(0, 10)
    const end = `${comingYear}-12-31`
    const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
      'primary_release_date.gte': today,
      'primary_release_date.lte': end,
      sort_by: 'primary_release_date.asc',
      'vote_count.gte': input.vote_count_gte,
      without_genres: input.without_genres,
      ...(input.genre != null ? { with_genres: input.genre } : {}),
      page: String(page),
    })
    const sorted = sortDiscoverPageByReleaseAsc(data)
    return {
      ...sorted,
      results: sorted.results.filter(passesComingDiscoverSoftQuality),
    }
  }
  if (mode === 'trending') {
    const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/movie/day', {
      page: String(page),
    })
    const todayIso = new Date().toISOString().slice(0, 10)
    return {
      ...data,
      results: applyTrendingRecencyBias(
        data.results.filter((m) => isMainstreamTrendingMovie(m, todayIso)),
        todayIso
      ),
    }
  }
  const q: Record<string, string> = {
    sort_by: input.sort_by,
    page: String(page),
    'vote_count.gte': input.vote_count_gte,
    without_genres: input.without_genres,
  }
  if (input.genre) q['with_genres'] = input.genre
  if (input.year) q['primary_release_year'] = input.year
  if (input.primary_release_date_gte) q['primary_release_date.gte'] = input.primary_release_date_gte
  if (input.primary_release_date_lte) q['primary_release_date.lte'] = input.primary_release_date_lte
  if (input.with_watch_providers) {
    q['with_watch_providers'] = input.with_watch_providers
    q['watch_region'] = 'US'
  }
  if (input.with_companies) q['with_companies'] = input.with_companies
  if (input.with_origin_country) q['with_origin_country'] = input.with_origin_country
  if (input.with_runtime_gte) q['with_runtime.gte'] = input.with_runtime_gte
  if (input.with_runtime_lte) q['with_runtime.lte'] = input.with_runtime_lte
  if (input.vote_average_gte) q['vote_average.gte'] = input.vote_average_gte
  if (input.with_original_language) q['with_original_language'] = input.with_original_language
  const shouldUseYearBuckets = input.sort_by === 'primary_release_date.desc' && input.year == null
  if (shouldUseYearBuckets) return discoverYearBucketFeed(page)
  const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', q)
  if (input.sort_by === 'primary_release_date.desc') return sortPageByYearThenHype(data)
  return sortPageByHype(data)
}

export function discoverStateToBrowseInput(
  state: MoviesDiscoverState,
  page: number
): { input: DiscoverMoviesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const isGenreOnlyFeed =
    state.sortParam === 'popularity.desc' &&
    state.genre != null &&
    state.comingYear == null &&
    (state.expectedYear == null || state.expectedMonth == null) &&
    state.year == null &&
    state.provider == null &&
    state.studio == null &&
    state.rating == null &&
    state.language == null &&
    state.country == null &&
    state.runtime == null

  const isDefaultMoviesFeed =
    state.sortParam === 'popularity.desc' &&
    state.comingYear == null &&
    (state.expectedYear == null || state.expectedMonth == null) &&
    state.genre == null &&
    state.year == null &&
    state.provider == null &&
    state.studio == null &&
    state.rating == null &&
    state.language == null &&
    state.country == null &&
    state.runtime == null

  const input: DiscoverMoviesBrowseInput = {
    sort_by: state.sortBy,
    page,
    vote_count_gte: state.voteCountGte,
    without_genres: '16',
  }

  if (isDefaultMoviesFeed) {
    // Default /movies feed: years descend (2026 -> 2025 -> ...), hype-first inside each year.
    const y = new Date().getFullYear()
    input.sort_by = 'primary_release_date.desc'
    input.primary_release_date_lte = `${y}-12-31`
    input.vote_count_gte = '0'
  }
  if (isGenreOnlyFeed) {
    // Genre category default: start from 2026 and go down by date (2026 -> older), no unreleased items.
    input.sort_by = 'primary_release_date.desc'
    input.primary_release_date_lte = new Date().toISOString().slice(0, 10)
    input.vote_count_gte = '0'
  }

  if (state.genre != null) input.genre = state.genre
  if (state.year != null) input.year = state.year
  if (state.provider != null) input.with_watch_providers = state.provider
  if (state.studio != null) input.with_companies = state.studio
  if (state.rating != null) input.vote_average_gte = state.rating
  if (state.language != null) input.with_original_language = state.language
  if (state.country != null) input.with_origin_country = state.country
  if (state.runtime != null) {
    const [gte, lte] = state.runtime.split('-', 2)
    if (gte) input.with_runtime_gte = gte
    if (lte) input.with_runtime_lte = lte
  }

  if (state.comingYear != null) {
    input.sort_by = 'primary_release_date.asc'
    input.vote_count_gte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
  }

  if (state.expectedYear != null && state.expectedMonth != null) {
    const today = new Date().toISOString().slice(0, 10)
    const win = expectedMonthReleaseWindow(state.expectedYear, state.expectedMonth, today)
    if (win != null) {
      input.primary_release_date_gte = win.dateGte
      input.primary_release_date_lte = win.dateLte
      input.sort_by = 'primary_release_date.asc'
      input.vote_count_gte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
      delete input.year
    } else {
      /** Past month / invalid window — keep browse deterministic (empty TMDB slice). */
      input.primary_release_date_gte = '9999-01-01'
      input.primary_release_date_lte = '9999-01-02'
      input.sort_by = 'primary_release_date.asc'
      input.vote_count_gte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
      delete input.year
    }
  }

  const payload: {
    input: DiscoverMoviesBrowseInput
    mode: 'discover' | 'trending'
    comingYear?: number
  } = {
    input,
    mode: state.browseMode,
  }
  if (state.comingYear != null) payload.comingYear = state.comingYear
  return payload
}

/** Query string keys consumed by `/api/discover` (client infinite scroll). */
export function discoverStateToFetchParams(state: MoviesDiscoverState): Record<string, string> {
  const o: Record<string, string> = {
    vote_count_gte: state.voteCountGte,
    without_genres: '16',
  }
  if (state.genre) o.genre = state.genre
  if (state.year) o.year = state.year
  if (state.sortParam !== 'popularity.desc') o.sort = state.sortParam
  if (state.provider) o.provider = state.provider
  if (state.studio) o.studio = state.studio
  if (state.rating) o.rating = state.rating
  if (state.language) o.language = state.language
  if (state.country) o.country = state.country
  if (state.runtime) o.runtime = state.runtime
  if (state.comingYear != null) o.coming = String(state.comingYear)
  if (state.expectedYear != null && state.expectedMonth != null) {
    o.expected = `${state.expectedYear}-${String(state.expectedMonth).padStart(2, '0')}`
  }
  return o
}

/** Stable key for resetting client infinite scroll when filters change. */
export function discoverFetchKey(state: MoviesDiscoverState): string {
  const e = Object.entries(discoverStateToFetchParams(state)).sort(([a], [b]) => a.localeCompare(b))
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

// ── Series discover browse (`/series` + TMDB discover + `/api/series-discover`) ──

export interface SeriesDiscoverState {
  genre?: string
  year?: string
  sortParam: string
  provider?: string
  studio?: string
  rating?: string
  language?: string
  country?: string
  runtime?: string
  comingYear?: number
  browseMode: 'discover' | 'trending'
  sortBy: string
  voteCountGte: string
}

const TV_SHOW_ONLY_GENRE_IDS = ['10764', '10767', '10763', '10766'] as const
const TV_SHOW_ONLY_GENRE_SET = new Set<string>(TV_SHOW_ONLY_GENRE_IDS)
const TV_SHOW_ONLY_WITH_GENRES = TV_SHOW_ONLY_GENRE_IDS.join('|')
const SERIES_ONLY_WITHOUT_GENRES = `16,${TV_SHOW_ONLY_GENRE_IDS.join(',')}`

export function parseSeriesDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): SeriesDiscoverState {
  const nowYear = new Date().getFullYear()
  const comingRaw = qp(sp, 'coming')
  const comingYear =
    comingRaw != null && comingRaw !== '' ? clampBrowseYear(comingRaw, nowYear) : undefined

  const genre = sanitizeDigitsId(qp(sp, 'genre'))
  const yearRaw = qp(sp, 'year')
  const year =
    comingYear != null
      ? undefined
      : yearRaw != null && yearRaw !== ''
        ? String(clampBrowseYear(yearRaw, nowYear))
        : undefined

  const provider = sanitizeDigitsId(qp(sp, 'provider'))
  const studio = sanitizeDigitsId(qp(sp, 'studio'))
  const rating = sanitizeVoteAverageGte(qp(sp, 'rating'))
  const language = sanitizeIso639(qp(sp, 'language'))
  const country = sanitizeIso3166(qp(sp, 'country'))
  const runtime = sanitizeRuntimeBucket(qp(sp, 'runtime'))

  const sortParam = sanitizeDiscoverSortParam(qp(sp, 'sort'))
  let browseMode: 'discover' | 'trending' = 'discover'
  let sortBy = 'popularity.desc'
  let voteCountGte = '5'

  if (sortParam === 'trending') {
    browseMode = 'trending'
  } else if (sortParam === 'top') {
    sortBy = 'vote_average.desc'
    voteCountGte = '200'
  } else {
    sortBy = sortParam
  }

  if (comingYear != null) {
    voteCountGte = String(COMING_BLOCKBUSTER_TV_VOTE_MIN)
  }

  const out: SeriesDiscoverState = {
    sortParam,
    browseMode,
    sortBy,
    voteCountGte,
  }
  if (genre != null) out.genre = genre
  if (year != null) out.year = year
  if (provider != null) out.provider = provider
  if (studio != null) out.studio = studio
  if (rating != null) out.rating = rating
  if (language != null) out.language = language
  if (country != null) out.country = country
  if (runtime != null) out.runtime = runtime
  if (comingYear != null) out.comingYear = comingYear
  return out
}

interface DiscoverSeriesBrowseInput {
  genre?: string
  year?: string
  first_air_date_lte?: string
  sort_by: string
  page: number
  with_watch_providers?: string
  with_networks?: string
  with_origin_country?: string
  with_runtime_gte?: string
  with_runtime_lte?: string
  vote_count_gte: string
  vote_average_gte?: string
  with_original_language?: string
  without_genres: string
}

export async function discoverSeriesBrowse(
  input: DiscoverSeriesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  const includeGenres = (input.genre ?? '')
    .split(/[|,]/)
    .map((x) => x.trim())
    .filter(Boolean)
  const excludeGenres = (input.without_genres ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  const byGenreConstraints = (rows: TmdbRawMedia[]): TmdbRawMedia[] =>
    rows.filter((m) => {
      const ids = new Set((m.genre_ids ?? []).map(String))
      if (includeGenres.length > 0 && !includeGenres.some((g) => ids.has(g))) return false
      if (excludeGenres.some((g) => ids.has(g))) return false
      return true
    })

  const rankByHypeDesc = (rows: TmdbRawMedia[]): TmdbRawMedia[] =>
    [...rows].sort((a, b) => {
      const byPopularity = b.popularity - a.popularity
      if (byPopularity !== 0) return byPopularity
      const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
      if (byVotes !== 0) return byVotes
      return b.vote_average - a.vote_average
    })

  const rankByYearThenHypeDesc = (rows: TmdbRawMedia[]): TmdbRawMedia[] =>
    [...rows].sort((a, b) => {
      const yearA = Number.parseInt((a.first_air_date ?? '').slice(0, 4), 10)
      const yearB = Number.parseInt((b.first_air_date ?? '').slice(0, 4), 10)
      const safeYearA = Number.isFinite(yearA) ? yearA : 0
      const safeYearB = Number.isFinite(yearB) ? yearB : 0
      const byYear = safeYearB - safeYearA
      if (byYear !== 0) return byYear
      const byPopularity = b.popularity - a.popularity
      if (byPopularity !== 0) return byPopularity
      const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
      if (byVotes !== 0) return byVotes
      return b.vote_average - a.vote_average
    })

  const sortPageByHype = (
    pageData: TmdbDiscoverPage<TmdbRawMedia>
  ): TmdbDiscoverPage<TmdbRawMedia> => ({
    ...pageData,
    results: rankByHypeDesc(pageData.results),
  })

  const sortPageByYearThenHype = (
    pageData: TmdbDiscoverPage<TmdbRawMedia>
  ): TmdbDiscoverPage<TmdbRawMedia> => ({
    ...pageData,
    results: rankByYearThenHypeDesc(pageData.results),
  })

  const getYearFeedStats = async (year: number): Promise<YearFeedStats> => {
    const cached = tvYearFeedStatsCache.get(year)
    if (cached != null && Date.now() - cached.at < YEAR_FEED_STATS_TTL_MS) return cached
    const res = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: String(year),
      sort_by: 'popularity.desc',
      'vote_count.gte': '0',
      without_genres: input.without_genres,
      ...(input.genre != null ? { with_genres: input.genre } : {}),
      page: '1',
    })
    const stats: YearFeedStats = {
      at: Date.now(),
      totalPages: Math.max(0, Math.min(500, res.total_pages)),
      totalResults: Math.max(0, res.total_results),
    }
    tvYearFeedStatsCache.set(year, stats)
    return stats
  }

  const discoverYearBucketFeed = async (
    globalPage: number
  ): Promise<TmdbDiscoverPage<TmdbRawMedia>> => {
    let remaining = globalPage
    const parsedLteYear = Number.parseInt((input.first_air_date_lte ?? '').slice(0, 4), 10)
    const currentYear = Number.isFinite(parsedLteYear) ? parsedLteYear : new Date().getFullYear()
    const minYear = 1900
    let knownResults = 0

    for (let year = currentYear; year >= minYear; year -= 1) {
      const stats = await getYearFeedStats(year)
      knownResults += stats.totalResults
      if (stats.totalPages === 0) continue
      if (remaining > stats.totalPages) {
        remaining -= stats.totalPages
        continue
      }

      const pageData = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
        first_air_date_year: String(year),
        sort_by: 'popularity.desc',
        'vote_count.gte': '0',
        without_genres: input.without_genres,
        ...(input.genre != null ? { with_genres: input.genre } : {}),
        page: String(remaining),
      })
      return {
        ...pageData,
        page: globalPage,
        total_pages: 50000,
        total_results: knownResults,
        results: rankByHypeDesc(pageData.results),
      }
    }

    return {
      page: globalPage,
      total_pages: globalPage,
      total_results: knownResults,
      results: [],
    }
  }

  const page = Math.min(500, Math.max(1, input.page))
  if (comingYear != null) {
    const today = new Date().toISOString().slice(0, 10)
    const end = `${comingYear}-12-31`
    const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      'first_air_date.gte': today,
      'first_air_date.lte': end,
      sort_by: 'first_air_date.asc',
      'vote_count.gte': input.vote_count_gte,
      without_genres: input.without_genres,
      ...(input.genre != null ? { with_genres: input.genre } : {}),
      page: String(page),
    })
    const sorted = sortDiscoverPageByReleaseAsc(data)
    return {
      ...sorted,
      results: sorted.results.filter(passesComingDiscoverSoftQuality),
    }
  }
  if (mode === 'trending') {
    const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/day', {
      page: String(page),
    })
    return sortPageByHype({ ...data, results: byGenreConstraints(data.results) })
  }
  const q: Record<string, string> = {
    sort_by: input.sort_by,
    page: String(page),
    'vote_count.gte': input.vote_count_gte,
    without_genres: input.without_genres,
  }
  if (input.genre) q.with_genres = input.genre
  if (input.year) q.first_air_date_year = input.year
  if (input.first_air_date_lte) q['first_air_date.lte'] = input.first_air_date_lte
  if (input.with_watch_providers) {
    q.with_watch_providers = input.with_watch_providers
    q.watch_region = 'US'
  }
  if (input.with_networks) q.with_networks = input.with_networks
  if (input.with_origin_country) q.with_origin_country = input.with_origin_country
  if (input.with_runtime_gte) q['with_runtime.gte'] = input.with_runtime_gte
  if (input.with_runtime_lte) q['with_runtime.lte'] = input.with_runtime_lte
  if (input.vote_average_gte) q['vote_average.gte'] = input.vote_average_gte
  if (input.with_original_language) q.with_original_language = input.with_original_language
  const shouldUseYearBuckets = input.sort_by === 'first_air_date.desc' && input.year == null
  if (shouldUseYearBuckets) return discoverYearBucketFeed(page)
  const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', q)
  if (input.sort_by === 'first_air_date.desc') return sortPageByYearThenHype(data)
  return sortPageByHype(data)
}

export function discoverSeriesStateToBrowseInput(
  state: SeriesDiscoverState,
  page: number
): { input: DiscoverSeriesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const isDefaultSeriesFeed =
    state.sortParam === 'popularity.desc' &&
    state.comingYear == null &&
    state.genre == null &&
    state.year == null &&
    state.provider == null &&
    state.studio == null &&
    state.rating == null &&
    state.language == null &&
    state.country == null &&
    state.runtime == null

  const input: DiscoverSeriesBrowseInput = {
    sort_by: state.sortBy,
    page,
    vote_count_gte: state.voteCountGte,
    without_genres: SERIES_ONLY_WITHOUT_GENRES,
  }

  if (isDefaultSeriesFeed) {
    const y = new Date().getFullYear()
    input.sort_by = 'first_air_date.desc'
    input.first_air_date_lte = `${y}-12-31`
    input.vote_count_gte = '0'
  }

  if (state.genre != null) input.genre = state.genre
  if (state.year != null) input.year = state.year
  if (state.provider != null) input.with_watch_providers = state.provider
  if (state.studio != null) input.with_networks = state.studio
  if (state.rating != null) input.vote_average_gte = state.rating
  if (state.language != null) input.with_original_language = state.language
  if (state.country != null) input.with_origin_country = state.country
  if (state.runtime != null) {
    const [gte, lte] = state.runtime.split('-', 2)
    if (gte) input.with_runtime_gte = gte
    if (lte) input.with_runtime_lte = lte
  }

  if (state.comingYear != null) {
    input.sort_by = 'first_air_date.asc'
    input.vote_count_gte = String(COMING_BLOCKBUSTER_TV_VOTE_MIN)
  }

  const payload: {
    input: DiscoverSeriesBrowseInput
    mode: 'discover' | 'trending'
    comingYear?: number
  } = {
    input,
    mode: state.browseMode,
  }
  if (state.comingYear != null) payload.comingYear = state.comingYear
  return payload
}

export function discoverSeriesStateToFetchParams(
  state: SeriesDiscoverState
): Record<string, string> {
  const o: Record<string, string> = {
    vote_count_gte: state.voteCountGte,
    without_genres: SERIES_ONLY_WITHOUT_GENRES,
  }
  if (state.genre) o.genre = state.genre
  if (state.year) o.year = state.year
  if (state.sortParam !== 'popularity.desc') o.sort = state.sortParam
  if (state.provider) o.provider = state.provider
  if (state.studio) o.studio = state.studio
  if (state.rating) o.rating = state.rating
  if (state.language) o.language = state.language
  if (state.country) o.country = state.country
  if (state.runtime) o.runtime = state.runtime
  if (state.comingYear != null) o.coming = String(state.comingYear)
  return o
}

export function discoverSeriesFetchKey(state: SeriesDiscoverState): string {
  const e = Object.entries(discoverSeriesStateToFetchParams(state)).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

// ── Cartoons discover browse (`/cartoons` + TMDB discover + `/api/cartoons-discover`) ──

export type CartoonsDiscoverState = MoviesDiscoverState

const CARTOON_WITHOUT_GENRES = '99,10402,10764,10767,10763,10766'

function mergeAnimationGenre(rawGenre: string | undefined): string {
  if (rawGenre == null || rawGenre === '') return '16'
  if (rawGenre === '16') return '16'
  return `16,${rawGenre}`
}

export function parseCartoonsDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): CartoonsDiscoverState {
  return parseMoviesDiscoverSearchParams(sp)
}

export function discoverCartoonsStateToBrowseInput(
  state: CartoonsDiscoverState,
  page: number
): { input: DiscoverMoviesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const base = discoverStateToBrowseInput(state, page)
  const input: DiscoverMoviesBrowseInput = {
    ...base.input,
    genre: mergeAnimationGenre(base.input.genre),
    without_genres: CARTOON_WITHOUT_GENRES,
  }
  return { ...base, input }
}

export function discoverCartoonsStateToFetchParams(
  state: CartoonsDiscoverState
): Record<string, string> {
  const out = discoverStateToFetchParams(state)
  out.without_genres = CARTOON_WITHOUT_GENRES
  return out
}

export function discoverCartoonsFetchKey(state: CartoonsDiscoverState): string {
  const e = Object.entries(discoverCartoonsStateToFetchParams(state)).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

export async function discoverCartoonsBrowse(
  input: DiscoverMoviesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  if (mode !== 'trending') return discoverMoviesBrowse(input, mode, comingYear)
  const page = Math.min(500, Math.max(1, input.page))
  const data = await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/movie/day', {
    page: String(page),
  })
  const animationOnly = data.results.filter((m) => (m.genre_ids ?? []).includes(16))
  const rankByHypeDesc = (rows: TmdbRawMedia[]): TmdbRawMedia[] =>
    [...rows].sort((a, b) => {
      const byPopularity = b.popularity - a.popularity
      if (byPopularity !== 0) return byPopularity
      const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
      if (byVotes !== 0) return byVotes
      return b.vote_average - a.vote_average
    })
  return { ...data, results: rankByHypeDesc(animationOnly) }
}

export function mapTmdbCartoonRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return stripShelfGenreIds(mapToShelfItem(m, 'cartoon'))
}

export async function getTopCartoons2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  const year = '2026'
  const highPages = [1, 2, 3, 4, 5, 6]
  const midPages = [1, 2, 3, 4, 5, 6, 7, 8]
  const trendingPages = [1, 2, 3, 4, 5, 6]
  const popularPages = [1, 2, 3, 4, 5, 6]

  const [discoverHigh, discoverMid, trendingBatch, popularBatch] = await Promise.all([
    Promise.all(
      highPages.map((page) =>
        tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
          primary_release_year: year,
          sort_by: 'popularity.desc',
          'vote_count.gte': '80',
          with_genres: '16',
          without_genres: CARTOON_WITHOUT_GENRES,
          page: String(page),
        })
      )
    ),
    Promise.all(
      midPages.map((page) =>
        tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
          primary_release_year: year,
          sort_by: 'popularity.desc',
          'vote_count.gte': '10',
          with_genres: '16',
          without_genres: CARTOON_WITHOUT_GENRES,
          page: String(page),
        })
      )
    ),
    Promise.all(
      trendingPages.map((page) =>
        tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/movie/week', { page: String(page) })
      )
    ),
    Promise.all(
      popularPages.map((page) =>
        tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/movie/popular', { page: String(page) })
      )
    ),
  ])
  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    const y = Number.parseInt((m.release_date ?? '').slice(0, 4), 10)
    if (!Number.isFinite(y)) {
      if (!fromDiscover) return
    } else if (y !== 2026) return
    const ids = m.genre_ids ?? []
    if (!ids.includes(16)) return
    if (ids.includes(TV_MOVIE_GENRE_ID)) return
    if (!ids.length && !fromDiscover) return
    const prev = pool.get(m.id)
    if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
  }

  for (const res of discoverHigh) for (const m of res.results) consider(m, true)
  for (const res of discoverMid) for (const m of res.results) consider(m, true)
  for (const res of trendingBatch) for (const m of res.results) consider(m, false)
  for (const res of popularBatch) for (const m of res.results) consider(m, false)

  // If strict 2026 pool is still too small, backfill with 2025/2024 animation to keep mosaic diverse.
  const minUniqueTarget = Math.max(140, Math.floor(maxUrls * 0.5))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const y of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
            primary_release_year: y,
            sort_by: 'popularity.desc',
            'vote_count.gte': '5',
            with_genres: '16',
            without_genres: CARTOON_WITHOUT_GENRES,
            page: String(page),
          })
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          const ids = m.genre_ids ?? []
          if (!ids.includes(16) || ids.includes(TV_MOVIE_GENRE_ID)) continue
          const prev = pool.get(m.id)
          if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => getImageUrl(m.poster_path, 'w154'))
}

export function mapTmdbSeriesRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return stripShelfGenreIds(mapToShelfItem(m, 'series'))
}

export async function enrichSeriesShelfRuntime(items: ShelfItem[]): Promise<ShelfItem[]> {
  if (items.length === 0) return items
  const chunkSize = 8
  const out: ShelfItem[] = []

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const done = await Promise.all(
      chunk.map(async (item) => {
        if (item.type !== 'series' && item.type !== 'tvshow') return item
        try {
          const d = await tmdbFetch<{
            episode_run_time?: number[]
            last_episode_to_run?: {
              runtime?: number | null
              season_number?: number
              episode_number?: number
            }
          }>(`/tv/${item.id}`)
          const runtimeMinutes = await tvRuntimeWithEpisodeFallback(item.id, d)
          return { ...item, runtimeMinutes }
        } catch {
          return item
        }
      })
    )
    out.push(...done)
  }

  return out
}

// ── TV Shows discover browse (`/tvshows` + TMDB discover + `/api/tvshows-discover`) ──

export type TvShowsDiscoverState = SeriesDiscoverState

export function parseTvShowsDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): TvShowsDiscoverState {
  return parseSeriesDiscoverSearchParams(sp)
}

export function discoverTvShowsStateToBrowseInput(
  state: TvShowsDiscoverState,
  page: number
): { input: DiscoverSeriesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const base = discoverSeriesStateToBrowseInput(state, page)
  const selectedTvShowGenre =
    state.genre != null && TV_SHOW_ONLY_GENRE_SET.has(state.genre) ? state.genre : undefined
  const input: DiscoverSeriesBrowseInput = {
    ...base.input,
    genre: selectedTvShowGenre ?? TV_SHOW_ONLY_WITH_GENRES,
    without_genres: '16',
  }
  return { ...base, input }
}

export function discoverTvShowsStateToFetchParams(
  state: TvShowsDiscoverState
): Record<string, string> {
  const out = discoverSeriesStateToFetchParams(state)
  out.without_genres = '16'
  if (state.genre != null && !TV_SHOW_ONLY_GENRE_SET.has(state.genre)) delete out.genre
  return out
}

export function discoverTvShowsFetchKey(state: TvShowsDiscoverState): string {
  const e = Object.entries(discoverTvShowsStateToFetchParams(state)).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

export function discoverTvShowsBrowse(
  input: DiscoverSeriesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  return discoverSeriesBrowse(input, mode, comingYear)
}

export function mapTmdbTvShowRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  const base = stripShelfGenreIds(mapToShelfItem(m, 'tvshow'))
  const tvTitle = (m.name ?? m.original_name ?? '').trim()
  const tvDateRaw = (m.first_air_date ?? '').trim()
  return {
    ...base,
    title: tvTitle.length > 0 ? tvTitle : base.title,
    releaseDate: tvDateRaw.length > 0 ? new Date(tvDateRaw) : null,
  }
}

export function enrichTvShowsShelfRuntime(items: ShelfItem[]): Promise<ShelfItem[]> {
  return enrichSeriesShelfRuntime(items)
}

const MOSAIC_HERO_MOVIE_YEAR = 2026

function releaseDateYearIs(d: string | undefined, year: number): boolean {
  if (d == null || d.length < 4) return false
  const y = Number.parseInt(d.slice(0, 4), 10)
  return Number.isFinite(y) && y === year
}

function isMovieListRow(m: TmdbRawMedia): boolean {
  return m.title != null && m.title !== ''
}

/**
 * 2026 movie row: `release_date` year 2026 when present; if missing, only trust `fromDiscover`
 * (`primary_release_year=2026` on those endpoints).
 */
function isTheatricalMovie2026(m: TmdbRawMedia, fromDiscover: boolean): boolean {
  if (!isMovieListRow(m)) return false
  if (m.release_date == null || m.release_date === '') return fromDiscover
  return releaseDateYearIs(m.release_date, MOSAIC_HERO_MOVIE_YEAR)
}

function mosaicPopularityScore(m: TmdbRawMedia): number {
  const votes = m.vote_count ?? 0
  return m.popularity + Math.log10(votes + 1) * 2.5
}

/** Live-action / fiction mosaic: no animation, no TV-movie bucket, shelf genre guard; unknown genres only from discover. */
function passesMosaicFeatureFilm(m: TmdbRawMedia, fromDiscover: boolean): boolean {
  const ids = m.genre_ids
  if (ids?.includes(16)) return false
  if (ids?.includes(TV_MOVIE_GENRE_ID)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (!ids?.length && !fromDiscover) return false
  return true
}

/**
 * Hero mosaic posters: **movies only**, **release year 2026**, biased to **global buzz**
 * (TMDB `popularity` + vote count). Merges `/discover/movie` (high floor + fill), `/trending/movie/week`,
 * `/movie/now_playing`, `/movie/upcoming`, dedupes by id, sorts by score, returns top `maxUrls`.
 */
export async function getTopMovies2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  const y = String(MOSAIC_HERO_MOVIE_YEAR)
  const highPages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const midPages = [1, 2, 3, 4, 5, 6, 7, 8]
  const emptyDiscoverPage = (): TmdbDiscoverPage<TmdbRawMedia> => ({
    page: 1,
    total_pages: 0,
    total_results: 0,
    results: [],
  })
  const safeDiscoverMoviesBrowse = async (
    input: DiscoverMoviesBrowseInput,
    mode: 'discover' | 'trending',
    comingYear?: number
  ): Promise<TmdbDiscoverPage<TmdbRawMedia>> => {
    try {
      return await discoverMoviesBrowse(input, mode, comingYear)
    } catch {
      return emptyDiscoverPage()
    }
  }
  const safeTmdbPageFetch = async (
    endpoint: string,
    params: Record<string, string>
  ): Promise<TmdbDiscoverPage<TmdbRawMedia>> => {
    try {
      return await tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(endpoint, params)
    } catch {
      return emptyDiscoverPage()
    }
  }

  const [discoverHigh, discoverMid, trendW1, trendW2, trendW3, nowPlaying, upcoming, upcomingP2] =
    await Promise.all([
      Promise.all(
        highPages.map((page) =>
          safeDiscoverMoviesBrowse(
            {
              year: y,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '500',
              without_genres: SHELF_EXCLUDE,
            },
            'discover',
            undefined
          )
        )
      ),
      Promise.all(
        midPages.map((page) =>
          safeDiscoverMoviesBrowse(
            {
              year: y,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '120',
              without_genres: SHELF_EXCLUDE,
            },
            'discover',
            undefined
          )
        )
      ),
      safeTmdbPageFetch('/trending/movie/week', { page: '1' }),
      safeTmdbPageFetch('/trending/movie/week', { page: '2' }),
      safeTmdbPageFetch('/trending/movie/week', { page: '3' }),
      safeTmdbPageFetch('/movie/now_playing', { page: '1' }),
      safeTmdbPageFetch('/movie/upcoming', { page: '1' }),
      safeTmdbPageFetch('/movie/upcoming', { page: '2' }),
    ])

  const pool = new Map<number, TmdbRawMedia>()

  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    if (!isTheatricalMovie2026(m, fromDiscover)) return
    if (!passesMosaicFeatureFilm(m, fromDiscover)) return
    const prev = pool.get(m.id)
    if (prev == null || mosaicPopularityScore(m) > mosaicPopularityScore(prev)) pool.set(m.id, m)
  }

  for (const res of discoverHigh) {
    for (const m of res.results) consider(m, true)
  }
  for (const res of discoverMid) {
    for (const m of res.results) consider(m, true)
  }
  for (const m of trendW1.results) consider(m, false)
  for (const m of trendW2.results) consider(m, false)
  for (const m of trendW3.results) consider(m, false)
  for (const m of nowPlaying.results) consider(m, false)
  for (const m of upcoming.results) consider(m, false)
  for (const m of upcomingP2.results) consider(m, false)

  // If strict 2026 pool is still small in a region/data window, backfill with 2025/2024
  // to keep the hero bento diverse rather than repeating a narrow poster set.
  const minUniqueTarget = Math.max(160, Math.floor(maxUrls * 0.55))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const year of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          safeDiscoverMoviesBrowse(
            {
              year,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '8',
              without_genres: SHELF_EXCLUDE,
            },
            'discover',
            undefined
          )
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          if (!passesMosaicFeatureFilm(m, true)) continue
          const prev = pool.get(m.id)
          if (prev == null || mosaicPopularityScore(m) > mosaicPopularityScore(prev))
            pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  const ranked = [...pool.values()].sort(
    (a, b) => mosaicPopularityScore(b) - mosaicPopularityScore(a)
  )

  return ranked
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => getImageUrl(m.poster_path, 'w154'))
}

export async function getTopSeries2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  const year = '2026'
  const [discoverHigh, discoverMid, trendW1, trendW2, popular] = await Promise.all([
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '120',
      without_genres: SHELF_EXCLUDE,
      page: '1',
    }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '20',
      without_genres: SHELF_EXCLUDE,
      page: '2',
    }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '1' }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '2' }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/tv/popular', { page: '1' }),
  ])

  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    const y = Number.parseInt((m.first_air_date ?? '').slice(0, 4), 10)
    if (!Number.isFinite(y)) {
      if (!fromDiscover) return
    } else if (y !== 2026) return
    if (!passesMosaicFeatureFilm(m, fromDiscover)) return
    const prev = pool.get(m.id)
    if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
  }

  for (const m of discoverHigh.results) consider(m, true)
  for (const m of discoverMid.results) consider(m, true)
  for (const m of trendW1.results) consider(m, false)
  for (const m of trendW2.results) consider(m, false)
  for (const m of popular.results) consider(m, false)

  // Keep series hero bento diverse when strict 2026 pool is narrow.
  const minUniqueTarget = Math.max(150, Math.floor(maxUrls * 0.5))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const year of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          discoverSeriesBrowse(
            {
              year,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '5',
              without_genres: SHELF_EXCLUDE,
            },
            'discover',
            undefined
          )
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          const ids = m.genre_ids ?? []
          if (ids.includes(16)) continue
          if (ids.includes(TV_MOVIE_GENRE_ID)) continue
          const prev = pool.get(m.id)
          if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => getImageUrl(m.poster_path, 'w154'))
}

export async function getTopTvShows2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  const year = '2026'
  const [discoverHigh, discoverMid, trendW1, trendW2, popular] = await Promise.all([
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '80',
      with_genres: TV_SHOW_ONLY_WITH_GENRES,
      without_genres: '16',
      page: '1',
    }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10',
      with_genres: TV_SHOW_ONLY_WITH_GENRES,
      without_genres: '16',
      page: '2',
    }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '1' }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '2' }),
    tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/tv/popular', { page: '1' }),
  ])

  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    const y = Number.parseInt((m.first_air_date ?? '').slice(0, 4), 10)
    if (!Number.isFinite(y)) {
      if (!fromDiscover) return
    } else if (y !== 2026) return
    const ids = new Set((m.genre_ids ?? []).map(String))
    if (![...TV_SHOW_ONLY_GENRE_IDS].some((id) => ids.has(id))) return
    if (ids.has('16')) return
    if (!ids.size && !fromDiscover) return
    const prev = pool.get(m.id)
    if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
  }

  for (const m of discoverHigh.results) consider(m, true)
  for (const m of discoverMid.results) consider(m, true)
  for (const m of trendW1.results) consider(m, false)
  for (const m of trendW2.results) consider(m, false)
  for (const m of popular.results) consider(m, false)

  const minUniqueTarget = Math.max(150, Math.floor(maxUrls * 0.5))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const backfillYear of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          discoverSeriesBrowse(
            {
              year: backfillYear,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '5',
              genre: TV_SHOW_ONLY_WITH_GENRES,
              without_genres: '16',
            },
            'discover',
            undefined
          )
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          const ids = new Set((m.genre_ids ?? []).map(String))
          if (![...TV_SHOW_ONLY_GENRE_IDS].some((id) => ids.has(id))) continue
          if (ids.has('16')) continue
          const prev = pool.get(m.id)
          if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => getImageUrl(m.poster_path, 'w154'))
}

/** Map a discover list row to a shelf card (no detail enrichment). */
export function mapTmdbMovieRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return stripShelfGenreIds(mapToShelfItem(m, 'movie'))
}

/**
 * Discover/list rows do not include runtime. This lightweight pass fetches
 * only movie runtime for current page cards so `/movies` can render duration.
 */
export async function enrichMovieShelfRuntime(items: ShelfItem[]): Promise<ShelfItem[]> {
  if (items.length === 0) return items
  const chunkSize = 8
  const out: ShelfItem[] = []

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const done = await Promise.all(
      chunk.map(async (item) => {
        if (item.type !== 'movie' && item.type !== 'cartoon') return item
        if (movieRuntimeMinutesCache.has(item.id)) {
          return { ...item, runtimeMinutes: movieRuntimeMinutesCache.get(item.id) ?? null }
        }
        try {
          const d = await tmdbFetch<{ runtime?: number | null }>(`/movie/${item.id}`)
          const runtimeMinutes = d.runtime != null && d.runtime > 0 ? d.runtime : null
          movieRuntimeMinutesCache.set(item.id, runtimeMinutes)
          return { ...item, runtimeMinutes }
        } catch {
          movieRuntimeMinutesCache.set(item.id, null)
          return item
        }
      })
    )
    out.push(...done)
  }

  return out
}

// ── generateStaticParams helpers ─────────────────────────────────────────────
// Pre-render the most popular movie and series detail pages at build time.
// This converts them from Dynamic (ƒ) to Static (○/ISR), eliminating cold-start
// TTFB for the titles users are most likely to visit.
//
// Strategy: fetch top_rated + popular pages 1–5 (100 items each), dedupe by id,
// sort by popularity desc, return top N ids as slug strings.
// Cached at TMDB_REVALIDATE_ALL_TIME — these lists change slowly.

const STATIC_PARAMS_PAGES = 5 // pages 1–5 = up to 100 items per endpoint
const STATIC_PARAMS_LIMIT = 200 // final cap after dedup + sort

/**
 * Returns the top `limit` movie IDs (by popularity) for `generateStaticParams`.
 * Merges `/movie/top_rated` and `/movie/popular` to cover both critical acclaim
 * and current traffic — the union gives the best pre-render ROI.
 */
export async function getTopMovieIdsForStaticParams(
  limit = STATIC_PARAMS_LIMIT
): Promise<number[]> {
  const seen = new Set<number>()
  const items: Array<{ id: number; popularity: number }> = []

  const endpoints = ['/movie/top_rated', '/movie/popular'] as const
  for (const endpoint of endpoints) {
    for (let page = 1; page <= STATIC_PARAMS_PAGES; page++) {
      try {
        const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
          endpoint,
          { page: String(page) },
          { revalidate: TMDB_REVALIDATE_ALL_TIME }
        )
        for (const m of res.results) {
          if (!seen.has(m.id)) {
            seen.add(m.id)
            items.push({ id: m.id, popularity: m.popularity })
          }
        }
      } catch {
        // partial failure — continue with what we have
      }
    }
  }

  return items
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map((m) => m.id)
}

/**
 * Returns the top `limit` TV series IDs (by popularity) for `generateStaticParams`.
 * Merges `/tv/top_rated` and `/tv/popular`.
 */
export async function getTopSeriesIdsForStaticParams(
  limit = STATIC_PARAMS_LIMIT
): Promise<number[]> {
  const seen = new Set<number>()
  const items: Array<{ id: number; popularity: number }> = []

  const endpoints = ['/tv/top_rated', '/tv/popular'] as const
  for (const endpoint of endpoints) {
    for (let page = 1; page <= STATIC_PARAMS_PAGES; page++) {
      try {
        const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
          endpoint,
          { page: String(page) },
          { revalidate: TMDB_REVALIDATE_ALL_TIME }
        )
        for (const m of res.results) {
          if (!seen.has(m.id)) {
            seen.add(m.id)
            items.push({ id: m.id, popularity: m.popularity })
          }
        }
      } catch {
        // partial failure — continue with what we have
      }
    }
  }

  return items
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map((m) => m.id)
}

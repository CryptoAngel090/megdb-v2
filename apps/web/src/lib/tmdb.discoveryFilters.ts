import {
  COMBAT_SPORTS_PROGRAM_RE,
  SHELF_EXCLUDED_GENRE_IDS,
  TRENDING_MIN_VOTE_COUNT,
  TV_MOVIE_GENRE_ID,
} from './tmdb.constants'
import type { ShelfItem, TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

export function isCombatSportsOrWrestlingProgram(m: TmdbRawMedia): boolean {
  const blob = [m.title, m.name, m.original_title, m.original_name, m.overview]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join('\n')
  return COMBAT_SPORTS_PROGRAM_RE.test(blob)
}

export function passesShelfGenreFilter(m: TmdbRawMedia): boolean {
  const ids = m.genre_ids
  if (!ids?.length) return true
  return !ids.some((id) => SHELF_EXCLUDED_GENRE_IDS.has(id))
}

export function isNewThisWeekMovie(m: TmdbRawMedia): boolean {
  if (isCombatSportsOrWrestlingProgram(m)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) return false
  return true
}

export function isNewThisWeekSeries(m: TmdbRawMedia): boolean {
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

export function isComingShelfMovie(m: TmdbRawMedia): boolean {
  if (!m.poster_path) return false
  if (isCombatSportsOrWrestlingProgram(m)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(TV_MOVIE_GENRE_ID)) return false
  return true
}

export function passesExpectedMonthBlockbusterRaw(m: TmdbRawMedia): boolean {
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

export function passesExpectedMonthBlockbusterFallbackRaw(m: TmdbRawMedia): boolean {
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

export function sortDiscoverPageByReleaseAsc(
  data: TmdbDiscoverPage<TmdbRawMedia>
): TmdbDiscoverPage<TmdbRawMedia> {
  return { ...data, results: [...data.results].sort(compareTmdbUpcomingReleaseAsc) }
}

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

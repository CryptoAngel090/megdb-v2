import { TV_MOVIE_GENRE_ID } from './tmdb.constants'
import type { TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

function parseReleaseYearFromRawMedia(m: TmdbRawMedia): number | null {
  const y = m.release_date?.slice(0, 4) || m.first_air_date?.slice(0, 4)
  const n = Number(y)
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null
}

function parseReleaseIsoFromRawMedia(m: TmdbRawMedia): string | null {
  const d = (m.release_date || m.first_air_date || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}

function scoreSimilarCandidate(
  c: { overlap: number; year: number | null; voteAverage: number; voteCount: number; popularity: number },
  currentYear: number | null
): number {
  const overlapBoost = c.overlap * 4.2
  const yearBoost =
    currentYear != null && c.year != null ? Math.max(0, 14 - Math.abs(c.year - currentYear)) * 0.34 : 0
  const voteBoost = Math.min(c.voteAverage, 10) * 1.15
  const votesBoost = Math.log10(Math.max(1, c.voteCount + 1)) * 2.2
  const popBoost = Math.log10(Math.max(1, c.popularity + 1)) * 0.8
  return overlapBoost + yearBoost + voteBoost + votesBoost + popBoost
}

export function pickRelevantSimilarItems(
  candidates: TmdbRawMedia[],
  currentGenreIds: Set<number>,
  currentYear: number | null,
  limit = 16
): TmdbRawMedia[] {
  if (!Array.isArray(candidates) || candidates.length === 0) return []

  const ranked = candidates.map((m) => {
    const genreIds = (m.genre_ids ?? []).filter((id): id is number => Number.isFinite(id))
    const overlap = currentGenreIds.size ? genreIds.filter((id) => currentGenreIds.has(id)).length : 0
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

  pool = pool.filter((c) => {
    if (c.releaseIso == null || c.releaseIso > todayIso) return false
    if (c.isTvMovie) return false
    if (!currentIsAnimation && c.isAnimation) return false
    return true
  })

  if (currentGenreIds.size > 0) {
    pool = pool.filter((c) => c.overlap >= 1)
  }

  if (currentYear != null) {
    const strictYears = new Set([currentYear, currentYear - 1])
    pool = pool.filter((c) => c.year != null && strictYears.has(c.year))
  }

  const qualityPool = pool.filter((c) => c.voteAverage >= 5.2 && c.voteCount >= 25)
  if (qualityPool.length >= Math.min(limit, 6)) {
    pool = qualityPool
  }

  pool.sort((a, b) => scoreSimilarCandidate(b, currentYear) - scoreSimilarCandidate(a, currentYear))
  return pool.slice(0, limit).map((c) => c.raw)
}

export async function fetchDiscoverMoviesByGenresAndYears(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  genreIds: number[],
  years: number[],
  excludeMovieId: number,
  revalidate: number
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

export async function fetchDiscoverTvByGenresAndYears(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  genreIds: number[],
  years: number[],
  excludeTvId: number,
  revalidate: number
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

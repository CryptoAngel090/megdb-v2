import { rankByHypeDesc } from './tmdb.discoverSorting'
import type { TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

type YearFeedStats = { at: number; totalPages: number; totalResults: number }

const YEAR_FEED_STATS_TTL_MS = 60 * 60 * 1000
const movieYearFeedStatsCache = new Map<number, YearFeedStats>()
const tvYearFeedStatsCache = new Map<number, YearFeedStats>()

interface DiscoverMovieYearBucketInput {
  primary_release_date_lte?: string
  primary_release_date_gte?: string
  without_genres: string
  genre?: string
}

interface DiscoverSeriesYearBucketInput {
  first_air_date_lte?: string
  without_genres: string
  genre?: string
}

export async function discoverMovieYearBucketFeed(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  input: DiscoverMovieYearBucketInput,
  globalPage: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  const parsedLteYear = Number.parseInt((input.primary_release_date_lte ?? '').slice(0, 4), 10)
  const parsedGteYear = Number.parseInt((input.primary_release_date_gte ?? '').slice(0, 4), 10)
  const yearBucketCurrentYear = Number.isFinite(parsedLteYear) ? parsedLteYear : new Date().getFullYear()
  const yearBucketMinYear = Number.isFinite(parsedGteYear) ? parsedGteYear : 1900

  const getYearFeedStats = async (year: number): Promise<YearFeedStats> => {
    const cached = movieYearFeedStatsCache.get(year)
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
    movieYearFeedStatsCache.set(year, stats)
    return stats
  }

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
      ...(upperDate != null && year === currentYear ? { 'primary_release_date.lte': upperDate } : {}),
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

export async function discoverSeriesYearBucketFeed(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  input: DiscoverSeriesYearBucketInput,
  globalPage: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  const parsedLteYear = Number.parseInt((input.first_air_date_lte ?? '').slice(0, 4), 10)
  let remaining = globalPage
  const currentYear = Number.isFinite(parsedLteYear) ? parsedLteYear : new Date().getFullYear()
  const minYear = 1900
  let knownResults = 0

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

import { passesComingDiscoverSoftQuality } from './tmdb.expectedMonth'
import { applyTrendingRecencyBias, isMainstreamTrendingMovie } from './tmdb.discoveryFilters'
import { sortPageByHype, sortPageByYearThenHype } from './tmdb.discoverSorting'
import type { DiscoverMoviesBrowseInput, DiscoverSeriesBrowseInput } from './tmdb.discoverParams'
import type { TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

function sortDiscoverPageByReleaseAsc(
  pageData: TmdbDiscoverPage<TmdbRawMedia>
): TmdbDiscoverPage<TmdbRawMedia> {
  return {
    ...pageData,
    results: [...pageData.results].sort((a, b) => {
      const aDate = (a.release_date ?? a.first_air_date ?? '').trim()
      const bDate = (b.release_date ?? b.first_air_date ?? '').trim()
      return aDate.localeCompare(bDate)
    }),
  }
}

export async function discoverMoviesBrowse(
  input: DiscoverMoviesBrowseInput,
  mode: 'discover' | 'trending',
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    discoverMovieYearBucketFeed: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      input: DiscoverMoviesBrowseInput,
      globalPage: number
    ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>
  },
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  const page = Math.min(500, Math.max(1, input.page))
  if (
    input.primary_release_date_gte != null &&
    input.primary_release_date_lte != null &&
    comingYear == null
  ) {
    const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
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
    const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
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
    const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/movie/day', {
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
  if (input.genre) q.with_genres = input.genre
  if (input.year) q.primary_release_year = input.year
  if (input.primary_release_date_gte) q['primary_release_date.gte'] = input.primary_release_date_gte
  if (input.primary_release_date_lte) q['primary_release_date.lte'] = input.primary_release_date_lte
  if (input.with_watch_providers) {
    q.with_watch_providers = input.with_watch_providers
    q.watch_region = 'US'
  }
  if (input.with_companies) q.with_companies = input.with_companies
  if (input.with_origin_country) q.with_origin_country = input.with_origin_country
  if (input.with_runtime_gte) q['with_runtime.gte'] = input.with_runtime_gte
  if (input.with_runtime_lte) q['with_runtime.lte'] = input.with_runtime_lte
  if (input.vote_average_gte) q['vote_average.gte'] = input.vote_average_gte
  if (input.with_original_language) q.with_original_language = input.with_original_language
  const shouldUseYearBuckets = input.sort_by === 'primary_release_date.desc' && input.year == null
  if (shouldUseYearBuckets) return deps.discoverMovieYearBucketFeed(deps.tmdbFetch, input, page)
  const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', q)
  if (input.sort_by === 'primary_release_date.desc') return sortPageByYearThenHype(data)
  return sortPageByHype(data)
}

export async function discoverSeriesBrowse(
  input: DiscoverSeriesBrowseInput,
  mode: 'discover' | 'trending',
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    discoverSeriesYearBucketFeed: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      input: DiscoverSeriesBrowseInput,
      globalPage: number
    ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>
  },
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

  const page = Math.min(500, Math.max(1, input.page))
  if (comingYear != null) {
    const today = new Date().toISOString().slice(0, 10)
    const end = `${comingYear}-12-31`
    const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
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
    const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/day', {
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
  if (shouldUseYearBuckets) return deps.discoverSeriesYearBucketFeed(deps.tmdbFetch, input, page)
  const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', q)
  if (input.sort_by === 'first_air_date.desc') return sortPageByYearThenHype(data)
  return sortPageByHype(data)
}

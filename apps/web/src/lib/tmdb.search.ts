import type { TmdbPaginated, TmdbRawMedia } from './tmdb.types'

export interface TmdbGenreListItem {
  id: number
  name: string
}

export async function searchMovies(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  query: string,
  revalidateModerate: number,
  year?: number | null
): Promise<TmdbRawMedia[]> {
  try {
    const params: Record<string, string> = { query }
    if (year != null) params.year = String(year)
    const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>('/search/movie', params, {
      revalidate: revalidateModerate,
    })
    return res.results ?? []
  } catch {
    return []
  }
}

export async function searchTvShows(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  query: string,
  revalidateModerate: number,
  year?: number | null
): Promise<TmdbRawMedia[]> {
  try {
    const params: Record<string, string> = { query }
    if (year != null) params.first_air_date_year = String(year)
    const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>('/search/tv', params, {
      revalidate: revalidateModerate,
    })
    return res.results ?? []
  } catch {
    return []
  }
}

export async function getMovieGenresList(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  revalidateAllTime: number
): Promise<TmdbGenreListItem[]> {
  const res = await tmdbFetch<{ genres?: TmdbGenreListItem[] }>(
    '/genre/movie/list',
    { language: 'en-US' },
    { revalidate: revalidateAllTime }
  )
  return res.genres ?? []
}

export async function getTvGenresList(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  revalidateAllTime: number
): Promise<TmdbGenreListItem[]> {
  const res = await tmdbFetch<{ genres?: TmdbGenreListItem[] }>(
    '/genre/tv/list',
    { language: 'en-US' },
    { revalidate: revalidateAllTime }
  )
  return res.genres ?? []
}

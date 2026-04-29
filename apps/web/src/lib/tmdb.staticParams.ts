import type { TmdbPaginated, TmdbRawMedia } from './tmdb.types'

async function getTopIdsForStaticParams(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  endpoints: readonly string[],
  pages: number,
  limit: number,
  revalidate: number
): Promise<number[]> {
  const seen = new Set<number>()
  const items: Array<{ id: number; popularity: number }> = []

  for (const endpoint of endpoints) {
    for (let page = 1; page <= pages; page++) {
      try {
        const res = await tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
          endpoint,
          { page: String(page) },
          { revalidate }
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

export async function getTopMovieIdsForStaticParams(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  pages: number,
  limit: number,
  revalidate: number
): Promise<number[]> {
  return getTopIdsForStaticParams(
    tmdbFetch,
    ['/movie/top_rated', '/movie/popular'],
    pages,
    limit,
    revalidate
  )
}

export async function getTopSeriesIdsForStaticParams(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  pages: number,
  limit: number,
  revalidate: number
): Promise<number[]> {
  return getTopIdsForStaticParams(
    tmdbFetch,
    ['/tv/top_rated', '/tv/popular'],
    pages,
    limit,
    revalidate
  )
}

import type { TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

export interface TmdbStudioListItem {
  id: number
  name: string
}

const STUDIOS_CACHE_TTL_MS = 6 * 60 * 60 * 1000
let movieStudiosCache: { at: number; items: TmdbStudioListItem[] } | null = null

export async function getMovieStudiosList(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  limit = 40
): Promise<TmdbStudioListItem[]> {
  if (movieStudiosCache != null && Date.now() - movieStudiosCache.at < STUDIOS_CACHE_TTL_MS) {
    return movieStudiosCache.items.slice(0, limit)
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
        if (prev) prev.count += 1
        else bucket.set(c.id, { id: c.id, name, count: 1 })
      }
    }
  }

  const items = [...bucket.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ id, name }) => ({ id, name }))

  movieStudiosCache = { at: Date.now(), items }
  return items
}

export async function getSeriesStudiosList(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  limit = 40
): Promise<TmdbStudioListItem[]> {
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

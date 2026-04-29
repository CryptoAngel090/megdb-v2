import type { ShelfItem } from './tmdb.types'

export async function enrichSeriesShelfRuntime(
  items: ShelfItem[],
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    tvRuntimeWithEpisodeFallback: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      tvId: number,
      d: {
        episode_run_time?: number[]
        last_episode_to_run?: {
          runtime?: number | null
          season_number?: number
          episode_number?: number
        }
      },
      revalidate: number
    ) => Promise<number | null>
    defaultRevalidate: number
  }
): Promise<ShelfItem[]> {
  if (items.length === 0) return items
  const chunkSize = 8
  const out: ShelfItem[] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const done = await Promise.all(
      chunk.map(async (item) => {
        if (item.type !== 'series' && item.type !== 'tvshow') return item
        try {
          const d = await deps.tmdbFetch<{
            episode_run_time?: number[]
            last_episode_to_run?: {
              runtime?: number | null
              season_number?: number
              episode_number?: number
            }
          }>(`/tv/${item.id}`)
          const runtimeMinutes = await deps.tvRuntimeWithEpisodeFallback(
            deps.tmdbFetch,
            item.id,
            d,
            deps.defaultRevalidate
          )
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

export async function enrichMovieShelfRuntime(
  items: ShelfItem[],
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    movieRuntimeMinutesCache: Map<number, number | null>
  }
): Promise<ShelfItem[]> {
  if (items.length === 0) return items
  const chunkSize = 8
  const out: ShelfItem[] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const done = await Promise.all(
      chunk.map(async (item) => {
        if (item.type !== 'movie' && item.type !== 'cartoon') return item
        if (deps.movieRuntimeMinutesCache.has(item.id)) {
          return { ...item, runtimeMinutes: deps.movieRuntimeMinutesCache.get(item.id) ?? null }
        }
        try {
          const d = await deps.tmdbFetch<{ runtime?: number | null }>(`/movie/${item.id}`)
          const runtimeMinutes = d.runtime != null && d.runtime > 0 ? d.runtime : null
          deps.movieRuntimeMinutesCache.set(item.id, runtimeMinutes)
          return { ...item, runtimeMinutes }
        } catch {
          deps.movieRuntimeMinutesCache.set(item.id, null)
          return item
        }
      })
    )
    out.push(...done)
  }
  return out
}

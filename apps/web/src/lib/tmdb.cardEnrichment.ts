import type { MoviePageCardItem } from './tmdb.types'

export async function enrichMoviePageCardItemsWithDetails(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  items: MoviePageCardItem[],
  revalidate: number
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
            d.runtime != null && d.runtime > 0 ? Math.round(d.runtime) : (item.runtimeMinutes ?? null)

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

export async function enrichTvPageCardItemsWithDetails(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
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
  ) => Promise<number | null>,
  items: MoviePageCardItem[],
  revalidate: number
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

          const rt = await tvRuntimeWithEpisodeFallback(tmdbFetch, item.id, d, revalidate)
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

interface TvRuntimeDetailShape {
  episode_run_time?: number[]
  last_episode_to_run?: {
    runtime?: number | null
    season_number?: number
    episode_number?: number
  }
}

interface RuntimeResponse {
  runtime?: number | null
}

export function tvRuntimeMinutes(d: TvRuntimeDetailShape): number | null {
  const arr = d.episode_run_time?.filter((n) => n > 0) ?? []
  if (arr.length) return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  const last = d.last_episode_to_run?.runtime
  if (last != null && last > 0) return last
  return null
}

export async function tvRuntimeWithEpisodeFallback(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>,
  tvId: number,
  d: TvRuntimeDetailShape,
  revalidate: number
): Promise<number | null> {
  const direct = tvRuntimeMinutes(d)
  if (direct != null) return direct

  const last = d.last_episode_to_run
  if (last?.season_number != null && last.episode_number != null) {
    try {
      const ep = await tmdbFetch<RuntimeResponse>(
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
    const ep = await tmdbFetch<RuntimeResponse>(`/tv/${tvId}/season/1/episode/1`, undefined, {
      revalidate,
    })
    if (ep.runtime != null && ep.runtime > 0) return ep.runtime
  } catch {
    /* no runtime in TMDB */
  }

  return null
}

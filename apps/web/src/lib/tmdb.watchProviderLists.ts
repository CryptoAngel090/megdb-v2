export interface WatchProviderListItem {
  provider_id: number
  provider_name: string
  logo_path: string
}

interface WatchProvidersRegionBuckets {
  flatrate?: WatchProviderListItem[]
  rent?: WatchProviderListItem[]
  buy?: WatchProviderListItem[]
}

function pickProviderList(results: unknown): WatchProviderListItem[] {
  if (Array.isArray(results)) {
    return results
      .filter(
        (p): p is WatchProviderListItem =>
          p != null &&
          typeof p === 'object' &&
          'provider_id' in p &&
          'provider_name' in p &&
          typeof (p as { provider_id: unknown }).provider_id === 'number' &&
          typeof (p as { provider_name: unknown }).provider_name === 'string'
      )
      .slice(0, 50)
  }

  if (results != null && typeof results === 'object') {
    const us = (results as Record<string, WatchProvidersRegionBuckets>)['US']
    if (!us) return []
    const merged: WatchProviderListItem[] = []
    const seen = new Set<number>()
    for (const bucket of [us.flatrate, us.rent, us.buy]) {
      for (const p of bucket ?? []) {
        if (seen.has(p.provider_id)) continue
        seen.add(p.provider_id)
        merged.push(p)
      }
    }
    return merged.slice(0, 50)
  }

  return []
}

export async function getWatchProvidersMovieList(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>
): Promise<WatchProviderListItem[]> {
  const data = await tmdbFetch<{ results: unknown }>('/watch/providers/movie', {
    watch_region: 'US',
  })
  return pickProviderList(data.results)
}

export async function getWatchProvidersTvList(
  tmdbFetch: <T>(
    endpoint: string,
    params?: Record<string, string>,
    init?: { revalidate?: number; tags?: string[] }
  ) => Promise<T>
): Promise<WatchProviderListItem[]> {
  const data = await tmdbFetch<{ results: unknown }>('/watch/providers/tv', { watch_region: 'US' })
  return pickProviderList(data.results)
}

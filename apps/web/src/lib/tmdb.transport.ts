import { TMDB_BASE, TMDB_REVALIDATE_DEFAULT } from './tmdb.constants'

function getTmdbApiKey(): string {
  return process.env.TMDB_API_KEY?.trim() ?? ''
}

export function hasTmdbApiKey(): boolean {
  return getTmdbApiKey().length > 0
}

export async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
  init: { revalidate?: number; tags?: string[] } = {}
): Promise<T> {
  const key = getTmdbApiKey()
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', key)
  for (const [k, v] of Object.entries(params)) {
    if (v !== '') url.searchParams.set(k, v)
  }
  const nextOpt: { revalidate: number; tags?: string[] } = {
    revalidate: init.revalidate ?? TMDB_REVALIDATE_DEFAULT,
  }
  if (init.tags && init.tags.length > 0) nextOpt.tags = init.tags
  const res = await fetch(url.toString(), {
    cache: 'force-cache',
    next: nextOpt,
  })
  if (!res.ok) throw new Error(`TMDB ${res.status} ${endpoint}`)
  return (await res.json()) as T
}

export function getImageUrl(path: string | null | undefined, size = 'w500'): string {
  if (!path) return ''
  return `https://image.tmdb.org/t/p/${size}${path}`
}

import type { TmdbVideosResponse } from './tmdb.types'

export function mergeTmdbMovieVideoResults(
  ...lists: Array<TmdbVideosResponse['results'] | undefined>
): TmdbVideosResponse['results'] {
  const seen = new Set<string>()
  const out: TmdbVideosResponse['results'] = []
  for (const list of lists) {
    for (const v of list ?? []) {
      const k = typeof v.key === 'string' ? v.key.trim() : ''
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(v)
    }
  }
  return out
}

function videoTypeNorm(t: string | undefined): string {
  return (t ?? '').trim().toLowerCase()
}

export function pickPrimaryYoutubeVideo(
  results: TmdbVideosResponse['results'] | undefined
): { key: string; name: string; type: string; publishedAt: string | null } | null {
  if (!results?.length) return null
  const yt = results.filter((v) => (v.site ?? '').toLowerCase() === 'youtube')
  if (!yt.length) return null
  const ty = videoTypeNorm
  const v =
    yt.find((x) => ty(x.type) === 'trailer' && x.official) ??
    yt.find((x) => ty(x.type) === 'trailer') ??
    yt.find((x) => ty(x.type) === 'teaser' && x.official) ??
    yt.find((x) => ty(x.type) === 'teaser') ??
    yt.find((x) => ty(x.type) === 'clip' && x.official) ??
    yt.find((x) => ty(x.type) === 'clip') ??
    yt.find((x) => ty(x.type) === 'featurette') ??
    yt[0] ??
    null
  if (!v) return null
  return {
    key: v.key,
    name: typeof v.name === 'string' && v.name.trim() ? v.name.trim() : 'Trailer',
    type: v.type,
    publishedAt: v.published_at?.trim() ? v.published_at.trim() : null,
  }
}

export function pickTrailerKeyFromResults(
  results: TmdbVideosResponse['results'] | undefined
): string | null {
  return pickPrimaryYoutubeVideo(results)?.key ?? null
}

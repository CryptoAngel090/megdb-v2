import { SITE_URL } from '@/lib/site'

/** Stable fragment for the primary CreativeWork on detail pages. */
const JSON_LD_MAIN_ENTITY_FRAGMENT = 'main-entity'

export function jsonLdMainEntityId(canonicalPath: string): string {
  return `${SITE_URL}${canonicalPath}#${JSON_LD_MAIN_ENTITY_FRAGMENT}`
}

/** Stable VideoObject @id — avoids pointing at /trailer/ URLs blocked in robots.txt. */
export function jsonLdYoutubeVideoId(youtubeKey: string): string {
  return `https://www.youtube.com/watch?v=${youtubeKey}#video`
}

/** TMDB catalogue URL plus IMDb when TMDB exposes an id. */
export function jsonLdSameAsTmdb(opts: {
  tmdbId: number
  media: 'movie' | 'tv'
  imdbId: string | null | undefined
}): string[] {
  const urls: string[] = []
  const base =
    opts.media === 'movie'
      ? `https://www.themoviedb.org/movie/${opts.tmdbId}`
      : `https://www.themoviedb.org/tv/${opts.tmdbId}`
  urls.push(base)

  const raw = opts.imdbId?.trim()
  if (raw) {
    const tt = raw.startsWith('tt') ? raw : `tt${raw}`
    urls.push(`https://www.imdb.com/title/${tt}/`)
  }
  return urls
}

/** TMDB person URL, optional IMDb name id, optional official homepage. */
export function jsonLdSameAsPerson(opts: {
  tmdbId: number
  imdbId: string | null | undefined
  homepage: string | null | undefined
}): string[] {
  const urls: string[] = [`https://www.themoviedb.org/person/${opts.tmdbId}`]

  const raw = opts.imdbId?.trim()
  if (raw) {
    const id = raw.startsWith('nm')
      ? raw
      : /^\d+$/.test(raw)
        ? `nm${raw.padStart(7, '0')}`
        : `nm${raw.replace(/^nm/i, '').padStart(7, '0')}`
    urls.push(`https://www.imdb.com/name/${id}/`)
  }

  const home = opts.homepage?.trim()
  if (home && /^https?:\/\//i.test(home)) {
    try {
      const u = new URL(home)
      if (u.protocol === 'http:' || u.protocol === 'https:') urls.push(u.toString())
    } catch {
      /* skip invalid homepage */
    }
  }

  return urls
}

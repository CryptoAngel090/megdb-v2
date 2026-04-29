/** Episode runtime buckets used by `/series` and `/tvshows` discover filters. */
export const EPISODE_RUNTIME_BUCKET_LABELS: Record<string, string> = {
  '0-25': 'Under 25 min',
  '25-45': '25–45 min',
  '45-60': '45–60 min',
  '60-999': '60+ min',
}

/** Feature runtime buckets for `/movies` and `/cartoons` discover filters. */
export const MOVIE_RUNTIME_BUCKET_LABELS: Record<string, string> = {
  '0-90': 'Under 90 min',
  '90-120': '90–120 min',
  '120-150': '120–150 min',
  '150-999': '150+ min',
}

export function formatDiscoverLanguageCode(code: string): string {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' })
    return dn.of(code) ?? code
  } catch {
    return code
  }
}

export function formatDiscoverRegionCode(code: string): string {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' })
    return dn.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/** Human phrase for discover `sort` URL param (TMDB + MegDB aliases). */
export function formatDiscoverSortHuman(sortParam: string): string {
  const map: Record<string, string> = {
    trending: 'trending popularity',
    top: 'highest audience score',
    'popularity.desc': 'TMDB popularity',
    'popularity.asc': 'popularity (ascending)',
    'release_date.desc': 'release date (newest first)',
    'release_date.asc': 'release date (oldest first)',
    'vote_average.desc': 'average rating',
    'vote_average.asc': 'average rating (ascending)',
    'original_title.asc': 'title A–Z',
    'revenue.desc': 'estimated revenue',
  }
  return map[sortParam] ?? 'your selected sort order'
}

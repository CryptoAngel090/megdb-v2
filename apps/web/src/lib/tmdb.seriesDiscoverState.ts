import { COMING_BLOCKBUSTER_TV_VOTE_MIN } from './tmdb.constants'
import {
  clampBrowseYear,
  qp,
  sanitizeDigitsId,
  sanitizeDiscoverSortParam,
  sanitizeIso3166,
  sanitizeIso639,
  sanitizeRuntimeBucket,
  sanitizeVoteAverageGte,
} from './tmdb.browseSanitizers'

export interface SeriesDiscoverState {
  genre?: string
  year?: string
  sortParam: string
  provider?: string
  studio?: string
  rating?: string
  language?: string
  country?: string
  runtime?: string
  comingYear?: number
  browseMode: 'discover' | 'trending'
  sortBy: string
  voteCountGte: string
}

export const TV_SHOW_ONLY_GENRE_IDS = ['10764', '10767', '10763', '10766'] as const
export const TV_SHOW_ONLY_GENRE_SET = new Set<string>(TV_SHOW_ONLY_GENRE_IDS)
export const TV_SHOW_ONLY_WITH_GENRES = TV_SHOW_ONLY_GENRE_IDS.join('|')
export const SERIES_ONLY_WITHOUT_GENRES = `16,${TV_SHOW_ONLY_GENRE_IDS.join(',')}`

export function parseSeriesDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): SeriesDiscoverState {
  const nowYear = new Date().getFullYear()
  const comingRaw = qp(sp, 'coming')
  const comingYear =
    comingRaw != null && comingRaw !== '' ? clampBrowseYear(comingRaw, nowYear) : undefined

  const genre = sanitizeDigitsId(qp(sp, 'genre'))
  const yearRaw = qp(sp, 'year')
  const year =
    comingYear != null
      ? undefined
      : yearRaw != null && yearRaw !== ''
        ? String(clampBrowseYear(yearRaw, nowYear))
        : undefined

  const provider = sanitizeDigitsId(qp(sp, 'provider'))
  const studio = sanitizeDigitsId(qp(sp, 'studio'))
  const rating = sanitizeVoteAverageGte(qp(sp, 'rating'))
  const language = sanitizeIso639(qp(sp, 'language'))
  const country = sanitizeIso3166(qp(sp, 'country'))
  const runtime = sanitizeRuntimeBucket(qp(sp, 'runtime'))

  const sortParam = sanitizeDiscoverSortParam(qp(sp, 'sort'))
  let browseMode: 'discover' | 'trending' = 'discover'
  let sortBy = 'popularity.desc'
  let voteCountGte = '5'
  if (sortParam === 'trending') {
    browseMode = 'trending'
  } else if (sortParam === 'top') {
    sortBy = 'vote_average.desc'
    voteCountGte = '150'
  } else {
    sortBy = sortParam
  }

  if (comingYear != null) voteCountGte = String(COMING_BLOCKBUSTER_TV_VOTE_MIN)

  const out: SeriesDiscoverState = {
    sortParam,
    browseMode,
    sortBy,
    voteCountGte,
  }
  if (genre != null) out.genre = genre
  if (year != null) out.year = year
  if (provider != null) out.provider = provider
  if (studio != null) out.studio = studio
  if (rating != null) out.rating = rating
  if (language != null) out.language = language
  if (country != null) out.country = country
  if (runtime != null) out.runtime = runtime
  if (comingYear != null) out.comingYear = comingYear
  return out
}

/** Same shape as `moviesDiscoverActiveFilterKeys` for `/series` (no expected-month facet). */
export function seriesDiscoverActiveFilterKeys(state: SeriesDiscoverState): string[] {
  const keys: string[] = []
  if (state.genre) keys.push('genre')
  if (state.year) keys.push('year')
  if (state.sortParam !== 'popularity.desc') keys.push('sort')
  if (state.provider) keys.push('provider')
  if (state.studio) keys.push('studio')
  if (state.rating) keys.push('rating')
  if (state.language) keys.push('language')
  if (state.country) keys.push('country')
  if (state.runtime) keys.push('runtime')
  if (state.comingYear != null) keys.push('coming')
  return keys
}

import { COMING_BLOCKBUSTER_MOVIE_VOTE_MIN } from './tmdb.constants'
import {
  clampBrowseYear,
  parseExpectedMonthParam,
  qp,
  sanitizeCalendarMonth,
  sanitizeDigitsId,
  sanitizeDiscoverSortParam,
  sanitizeIso3166,
  sanitizeIso639,
  sanitizeRuntimeBucket,
  sanitizeVoteAverageGte,
} from './tmdb.browseSanitizers'

export interface MoviesDiscoverState {
  genre?: string
  year?: string
  /** Raw `sort` query: `trending`, `top`, or a TMDB `sort_by` value. */
  sortParam: string
  provider?: string
  studio?: string
  rating?: string
  language?: string
  country?: string
  runtime?: string
  comingYear?: number
  /** Calendar month spotlight (`/movies?expected=YYYY-MM`). */
  expectedYear?: number
  expectedMonth?: number
  browseMode: 'discover' | 'trending'
  /** TMDB `sort_by` when `browseMode === 'discover'` and not `comingYear`. */
  sortBy: string
  voteCountGte: string
}

/** Parse `searchParams` for `/movies` discover + legacy browse links (`sort`, `year`, `coming`). */
export function parseMoviesDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): MoviesDiscoverState {
  const nowYear = new Date().getFullYear()
  let expectedParsed = parseExpectedMonthParam(qp(sp, 'expected'))
  if (expectedParsed == null) {
    const mAlt = sanitizeCalendarMonth(qp(sp, 'month'))
    const yForExpected = qp(sp, 'year')
    if (mAlt != null && yForExpected != null && yForExpected !== '') {
      expectedParsed = { y: clampBrowseYear(yForExpected, nowYear), m: mAlt }
    }
  }

  const comingRaw = qp(sp, 'coming')
  const comingYear =
    expectedParsed != null
      ? undefined
      : comingRaw != null && comingRaw !== ''
        ? clampBrowseYear(comingRaw, nowYear)
        : undefined

  const genre = sanitizeDigitsId(qp(sp, 'genre'))
  const yearRaw = qp(sp, 'year')
  const year =
    expectedParsed != null || comingYear != null
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
    voteCountGte = '200'
  } else {
    sortBy = sortParam
  }

  if (comingYear != null || expectedParsed != null) {
    voteCountGte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
  }

  const out: MoviesDiscoverState = {
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
  if (expectedParsed != null) {
    out.expectedYear = expectedParsed.y
    out.expectedMonth = expectedParsed.m
  }
  return out
}

/** Labels for duplicate-content / metadata (order stable). */
export function moviesDiscoverActiveFilterKeys(state: MoviesDiscoverState): string[] {
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
  if (state.expectedYear != null && state.expectedMonth != null) keys.push('expected')
  return keys
}

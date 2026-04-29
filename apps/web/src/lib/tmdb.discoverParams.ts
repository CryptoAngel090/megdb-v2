import { COMING_BLOCKBUSTER_MOVIE_VOTE_MIN, COMING_BLOCKBUSTER_TV_VOTE_MIN } from './tmdb.constants'
import { expectedMonthReleaseWindow } from './tmdb.expectedMonth'
import type { MoviesDiscoverState } from './tmdb.moviesDiscoverState'
import {
  SERIES_ONLY_WITHOUT_GENRES,
  type SeriesDiscoverState,
} from './tmdb.seriesDiscoverState'

export interface DiscoverMoviesBrowseInput {
  genre?: string
  year?: string
  primary_release_date_gte?: string
  primary_release_date_lte?: string
  sort_by: string
  page: number
  with_watch_providers?: string
  with_companies?: string
  with_origin_country?: string
  with_runtime_gte?: string
  with_runtime_lte?: string
  vote_count_gte: string
  vote_average_gte?: string
  with_original_language?: string
  without_genres: string
}

export function discoverStateToBrowseInput(
  state: MoviesDiscoverState,
  page: number
): { input: DiscoverMoviesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const isGenreOnlyFeed =
    state.sortParam === 'popularity.desc' &&
    state.genre != null &&
    state.comingYear == null &&
    (state.expectedYear == null || state.expectedMonth == null) &&
    state.year == null &&
    state.provider == null &&
    state.studio == null &&
    state.rating == null &&
    state.language == null &&
    state.country == null &&
    state.runtime == null

  const isDefaultMoviesFeed =
    state.sortParam === 'popularity.desc' &&
    state.comingYear == null &&
    (state.expectedYear == null || state.expectedMonth == null) &&
    state.genre == null &&
    state.year == null &&
    state.provider == null &&
    state.studio == null &&
    state.rating == null &&
    state.language == null &&
    state.country == null &&
    state.runtime == null

  const input: DiscoverMoviesBrowseInput = {
    sort_by: state.sortBy,
    page,
    vote_count_gte: state.voteCountGte,
    without_genres: '16',
  }

  if (isDefaultMoviesFeed) {
    const y = new Date().getFullYear()
    input.sort_by = 'primary_release_date.desc'
    input.primary_release_date_lte = `${y}-12-31`
    input.vote_count_gte = '0'
  }
  if (isGenreOnlyFeed) {
    input.sort_by = 'primary_release_date.desc'
    input.primary_release_date_lte = new Date().toISOString().slice(0, 10)
    input.vote_count_gte = '0'
  }

  if (state.genre != null) input.genre = state.genre
  if (state.year != null) input.year = state.year
  if (state.provider != null) input.with_watch_providers = state.provider
  if (state.studio != null) input.with_companies = state.studio
  if (state.rating != null) input.vote_average_gte = state.rating
  if (state.language != null) input.with_original_language = state.language
  if (state.country != null) input.with_origin_country = state.country
  if (state.runtime != null) {
    const [gte, lte] = state.runtime.split('-', 2)
    if (gte) input.with_runtime_gte = gte
    if (lte) input.with_runtime_lte = lte
  }

  if (state.comingYear != null) {
    input.sort_by = 'primary_release_date.asc'
    input.vote_count_gte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
  }

  if (state.expectedYear != null && state.expectedMonth != null) {
    const today = new Date().toISOString().slice(0, 10)
    const win = expectedMonthReleaseWindow(state.expectedYear, state.expectedMonth, today)
    if (win != null) {
      input.primary_release_date_gte = win.dateGte
      input.primary_release_date_lte = win.dateLte
      input.sort_by = 'primary_release_date.asc'
      input.vote_count_gte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
      delete input.year
    } else {
      input.primary_release_date_gte = '9999-01-01'
      input.primary_release_date_lte = '9999-01-02'
      input.sort_by = 'primary_release_date.asc'
      input.vote_count_gte = String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN)
      delete input.year
    }
  }

  const payload: {
    input: DiscoverMoviesBrowseInput
    mode: 'discover' | 'trending'
    comingYear?: number
  } = {
    input,
    mode: state.browseMode,
  }
  if (state.comingYear != null) payload.comingYear = state.comingYear
  return payload
}

export function discoverStateToFetchParams(state: MoviesDiscoverState): Record<string, string> {
  const o: Record<string, string> = {
    vote_count_gte: state.voteCountGte,
    without_genres: '16',
  }
  if (state.genre) o.genre = state.genre
  if (state.year) o.year = state.year
  if (state.sortParam !== 'popularity.desc') o.sort = state.sortParam
  if (state.provider) o.provider = state.provider
  if (state.studio) o.studio = state.studio
  if (state.rating) o.rating = state.rating
  if (state.language) o.language = state.language
  if (state.country) o.country = state.country
  if (state.runtime) o.runtime = state.runtime
  if (state.comingYear != null) o.coming = String(state.comingYear)
  if (state.expectedYear != null && state.expectedMonth != null) {
    o.expected = `${state.expectedYear}-${String(state.expectedMonth).padStart(2, '0')}`
  }
  return o
}

export function discoverFetchKey(state: MoviesDiscoverState): string {
  const e = Object.entries(discoverStateToFetchParams(state)).sort(([a], [b]) => a.localeCompare(b))
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

export interface DiscoverSeriesBrowseInput {
  genre?: string
  year?: string
  first_air_date_lte?: string
  sort_by: string
  page: number
  with_watch_providers?: string
  with_networks?: string
  with_origin_country?: string
  with_runtime_gte?: string
  with_runtime_lte?: string
  vote_count_gte: string
  vote_average_gte?: string
  with_original_language?: string
  without_genres: string
}

export function discoverSeriesStateToBrowseInput(
  state: SeriesDiscoverState,
  page: number
): { input: DiscoverSeriesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const isDefaultSeriesFeed =
    state.sortParam === 'popularity.desc' &&
    state.comingYear == null &&
    state.genre == null &&
    state.year == null &&
    state.provider == null &&
    state.studio == null &&
    state.rating == null &&
    state.language == null &&
    state.country == null &&
    state.runtime == null

  const input: DiscoverSeriesBrowseInput = {
    sort_by: state.sortBy,
    page,
    vote_count_gte: state.voteCountGte,
    without_genres: SERIES_ONLY_WITHOUT_GENRES,
  }

  if (isDefaultSeriesFeed) {
    const y = new Date().getFullYear()
    input.sort_by = 'first_air_date.desc'
    input.first_air_date_lte = `${y}-12-31`
    input.vote_count_gte = '0'
  }

  if (state.genre != null) input.genre = state.genre
  if (state.year != null) input.year = state.year
  if (state.provider != null) input.with_watch_providers = state.provider
  if (state.studio != null) input.with_networks = state.studio
  if (state.rating != null) input.vote_average_gte = state.rating
  if (state.language != null) input.with_original_language = state.language
  if (state.country != null) input.with_origin_country = state.country
  if (state.runtime != null) {
    const [gte, lte] = state.runtime.split('-', 2)
    if (gte) input.with_runtime_gte = gte
    if (lte) input.with_runtime_lte = lte
  }

  if (state.comingYear != null) {
    input.sort_by = 'first_air_date.asc'
    input.vote_count_gte = String(COMING_BLOCKBUSTER_TV_VOTE_MIN)
  }

  const payload: {
    input: DiscoverSeriesBrowseInput
    mode: 'discover' | 'trending'
    comingYear?: number
  } = {
    input,
    mode: state.browseMode,
  }
  if (state.comingYear != null) payload.comingYear = state.comingYear
  return payload
}

export function discoverSeriesStateToFetchParams(state: SeriesDiscoverState): Record<string, string> {
  const o: Record<string, string> = {
    vote_count_gte: state.voteCountGte,
    without_genres: SERIES_ONLY_WITHOUT_GENRES,
  }
  if (state.genre) o.genre = state.genre
  if (state.year) o.year = state.year
  if (state.sortParam !== 'popularity.desc') o.sort = state.sortParam
  if (state.provider) o.provider = state.provider
  if (state.studio) o.studio = state.studio
  if (state.rating) o.rating = state.rating
  if (state.language) o.language = state.language
  if (state.country) o.country = state.country
  if (state.runtime) o.runtime = state.runtime
  if (state.comingYear != null) o.coming = String(state.comingYear)
  return o
}

export function discoverSeriesFetchKey(state: SeriesDiscoverState): string {
  const e = Object.entries(discoverSeriesStateToFetchParams(state)).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

import { rankByHypeDesc } from './tmdb.discoverSorting'
import type { DiscoverMoviesBrowseInput, DiscoverSeriesBrowseInput } from './tmdb.discoverParams'
import {
  discoverSeriesStateToBrowseInput,
  discoverSeriesStateToFetchParams,
  discoverStateToBrowseInput,
  discoverStateToFetchParams,
} from './tmdb.discoverParams'
import type { MoviesDiscoverState } from './tmdb.moviesDiscoverState'
import { parseMoviesDiscoverSearchParams } from './tmdb.moviesDiscoverState'
import type {
  SeriesDiscoverState,
} from './tmdb.seriesDiscoverState'
import { parseSeriesDiscoverSearchParams } from './tmdb.seriesDiscoverState'
import type { ShelfItem, TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

export type CartoonsDiscoverState = MoviesDiscoverState
export type TvShowsDiscoverState = SeriesDiscoverState

export const CARTOON_WITHOUT_GENRES = '99,10402,10764,10767,10763,10766'

function mergeAnimationGenre(rawGenre: string | undefined): string {
  if (rawGenre == null || rawGenre === '') return '16'
  if (rawGenre === '16') return '16'
  return `16,${rawGenre}`
}

export function parseCartoonsDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): CartoonsDiscoverState {
  return parseMoviesDiscoverSearchParams(sp)
}

export function discoverCartoonsStateToBrowseInput(
  state: CartoonsDiscoverState,
  page: number
): { input: DiscoverMoviesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const base = discoverStateToBrowseInput(state, page)
  const input: DiscoverMoviesBrowseInput = {
    ...base.input,
    genre: mergeAnimationGenre(base.input.genre),
    without_genres: CARTOON_WITHOUT_GENRES,
  }
  return { ...base, input }
}

export function discoverCartoonsStateToFetchParams(
  state: CartoonsDiscoverState
): Record<string, string> {
  const out = discoverStateToFetchParams(state)
  out.without_genres = CARTOON_WITHOUT_GENRES
  return out
}

export function discoverCartoonsFetchKey(state: CartoonsDiscoverState): string {
  const e = Object.entries(discoverCartoonsStateToFetchParams(state)).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

export async function discoverCartoonsBrowse(
  input: DiscoverMoviesBrowseInput,
  mode: 'discover' | 'trending',
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    discoverMoviesBrowse: (
      input: DiscoverMoviesBrowseInput,
      mode: 'discover' | 'trending',
      comingYear?: number
    ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>
  },
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  if (mode !== 'trending') return deps.discoverMoviesBrowse(input, mode, comingYear)
  const page = Math.min(500, Math.max(1, input.page))
  const data = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/movie/day', {
    page: String(page),
  })
  const animationOnly = data.results.filter((m) => (m.genre_ids ?? []).includes(16))
  return { ...data, results: rankByHypeDesc(animationOnly) }
}

export function mapTmdbCartoonRowToShelfItem(
  m: TmdbRawMedia,
  mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem,
  stripShelfGenreIds: (item: ShelfItem) => ShelfItem
): ShelfItem {
  return stripShelfGenreIds(mapToShelfItem(m, 'cartoon'))
}

export function parseTvShowsDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): TvShowsDiscoverState {
  return parseSeriesDiscoverSearchParams(sp)
}

export function discoverTvShowsStateToBrowseInput(
  state: TvShowsDiscoverState,
  page: number,
  tvShowOnlyGenreSet: ReadonlySet<string>,
  tvShowOnlyWithGenres: string
): { input: DiscoverSeriesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  const base = discoverSeriesStateToBrowseInput(state, page)
  const selectedTvShowGenre =
    state.genre != null && tvShowOnlyGenreSet.has(state.genre) ? state.genre : undefined
  const input: DiscoverSeriesBrowseInput = {
    ...base.input,
    genre: selectedTvShowGenre ?? tvShowOnlyWithGenres,
    without_genres: '16',
  }
  return { ...base, input }
}

export function discoverTvShowsStateToFetchParams(
  state: TvShowsDiscoverState,
  tvShowOnlyGenreSet: ReadonlySet<string>
): Record<string, string> {
  const out = discoverSeriesStateToFetchParams(state)
  out.without_genres = '16'
  if (state.genre != null && !tvShowOnlyGenreSet.has(state.genre)) delete out.genre
  return out
}

export function discoverTvShowsFetchKey(
  state: TvShowsDiscoverState,
  tvShowOnlyGenreSet: ReadonlySet<string>
): string {
  const e = Object.entries(discoverTvShowsStateToFetchParams(state, tvShowOnlyGenreSet)).sort(
    ([a], [b]) => a.localeCompare(b)
  )
  return e.map(([k, v]) => `${k}=${v}`).join('&')
}

export function discoverTvShowsBrowse(
  input: DiscoverSeriesBrowseInput,
  mode: 'discover' | 'trending',
  discoverSeriesBrowseFn: (
    input: DiscoverSeriesBrowseInput,
    mode: 'discover' | 'trending',
    comingYear?: number
  ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>,
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  return discoverSeriesBrowseFn(input, mode, comingYear)
}

export function mapTmdbTvShowRowToShelfItem(
  m: TmdbRawMedia,
  mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem,
  stripShelfGenreIds: (item: ShelfItem) => ShelfItem
): ShelfItem {
  const base = stripShelfGenreIds(mapToShelfItem(m, 'tvshow'))
  const tvTitle = (m.name ?? m.original_name ?? '').trim()
  const tvDateRaw = (m.first_air_date ?? '').trim()
  return {
    ...base,
    title: tvTitle.length > 0 ? tvTitle : base.title,
    releaseDate: tvDateRaw.length > 0 ? new Date(tvDateRaw) : null,
  }
}


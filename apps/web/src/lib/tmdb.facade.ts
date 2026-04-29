import type { MediaType } from '@repo/types'
import {
  CACHE_TAG_ALL_TIME,
  CACHE_TAG_HOME_MODERATE,
  CACHE_TAG_MOVIES,
  CACHE_TAG_PEOPLE,
  CACHE_TAG_TRENDING,
  cacheTagMovie,
  cacheTagPerson,
  cacheTagTv,
} from './cachePolicy'
import {
  COMBAT_SPORTS_PROGRAM_RE,
  GENRE_NAMES,
  HERO_EXCLUDE,
  SHELF_EXCLUDE,
  SHELF_EXCLUDED_GENRE_IDS,
  TMDB_BASE,
  TMDB_REVALIDATE_ALL_TIME,
  TMDB_REVALIDATE_DEFAULT,
  TMDB_REVALIDATE_ENRICHMENT,
  TMDB_REVALIDATE_FAST,
  TMDB_REVALIDATE_MODERATE,
  TMDB_REVALIDATE_PEOPLE,
  TRENDING_MIN_VOTE_COUNT,
  TV_MOVIE_GENRE_ID,
} from './tmdb.constants'
import {
  applyTrendingRecencyBias,
  compareShelfItemsByUpcomingReleaseAsc,
  isCombatSportsOrWrestlingProgram,
  isMainstreamTrendingMovie,
  isNewThisWeekMovie,
  isNewThisWeekSeries,
  passesShelfGenreFilter,
  sortDiscoverPageByReleaseAsc,
} from './tmdb.discoveryFilters'
import { buildMovieCreditsMeta, buildTvCreditsMeta, mapRawToCardItem } from './tmdb.detailPeople'
import {
  discoverFetchKey,
  discoverSeriesFetchKey,
  discoverSeriesStateToBrowseInput,
  discoverSeriesStateToFetchParams,
  discoverStateToBrowseInput,
  discoverStateToFetchParams,
  type DiscoverMoviesBrowseInput,
  type DiscoverSeriesBrowseInput,
} from './tmdb.discoverParams'
import { rankByHypeDesc, sortPageByHype, sortPageByYearThenHype } from './tmdb.discoverSorting'
import { passesComingDiscoverSoftQuality } from './tmdb.expectedMonth'
import {
  moviesDiscoverActiveFilterKeys,
  parseMoviesDiscoverSearchParams,
  type MoviesDiscoverState,
} from './tmdb.moviesDiscoverState'
import {
  parseSeriesDiscoverSearchParams,
  TV_SHOW_ONLY_GENRE_IDS,
  SERIES_ONLY_WITHOUT_GENRES,
  TV_SHOW_ONLY_GENRE_SET,
  TV_SHOW_ONLY_WITH_GENRES,
  type SeriesDiscoverState,
} from './tmdb.seriesDiscoverState'
import {
  mapPersonCombinedCredits,
  mapPersonImages,
  mapPersonPageDetail,
  mapTrendingPeople,
} from './tmdb.peopleNormalize'
import {
  formatMovieAgeRatingBadge,
  formatTvContentRatingBadge,
  pickAlternateDisplayTitle,
  type TmdbReleaseDatesPayload,
  type TmdbTvContentRatingsPayload,
} from './tmdb.certifications'
import { enrichMoviePageCardItemsWithDetails, enrichTvPageCardItemsWithDetails } from './tmdb.cardEnrichment'
import {
  pickHeroBackdropStillsForShell,
  type TmdbBackdropImageRow,
} from './tmdb.movieDetailHelpers'
import {
  fetchDiscoverMoviesByGenresAndYears,
  fetchDiscoverTvByGenresAndYears,
  pickRelevantSimilarItems,
} from './tmdb.similar'
import {
  mapToShelfItem,
  mergeUpToTwoGenres,
  stripShelfGenreIds,
} from './tmdb.shelfMapping'
import { tvRuntimeWithEpisodeFallback } from './tmdb.tvRuntime'
import {
  mergeTmdbMovieVideoResults,
  pickPrimaryYoutubeVideo,
  pickTrailerKeyFromResults,
} from './tmdb.videos'
import {
  getWatchProvidersMovieList as getWatchProvidersMovieListImpl,
  getWatchProvidersTvList as getWatchProvidersTvListImpl,
  type WatchProviderListItem,
} from './tmdb.watchProviderLists'
import { buildWatchNowUrl, buildWatchProviderUrl } from './tmdb.watchProviders'
import { buildWatchProvidersUs, buildWatchRows } from './tmdb.watchRows'
import { discoverMovieYearBucketFeed, discoverSeriesYearBucketFeed } from './tmdb.yearBucketFeeds'
import {
  getMovieStudiosList as getMovieStudiosListImpl,
  getSeriesStudiosList as getSeriesStudiosListImpl,
  type TmdbStudioListItem,
} from './tmdb.studios'
import {
  getTopMovieIdsForStaticParams as getTopMovieIdsForStaticParamsImpl,
  getTopSeriesIdsForStaticParams as getTopSeriesIdsForStaticParamsImpl,
} from './tmdb.staticParams'
import {
  getTopCartoons2026MosaicPosterUrls as getTopCartoons2026MosaicPosterUrlsImpl,
  getTopMovies2026MosaicPosterUrls as getTopMovies2026MosaicPosterUrlsImpl,
  getTopSeries2026MosaicPosterUrls as getTopSeries2026MosaicPosterUrlsImpl,
  getTopTvShows2026MosaicPosterUrls as getTopTvShows2026MosaicPosterUrlsImpl,
} from './tmdb.mosaic'
import {
  CARTOON_WITHOUT_GENRES,
  discoverCartoonsBrowse as discoverCartoonsBrowseImpl,
  discoverCartoonsFetchKey as discoverCartoonsFetchKeyImpl,
  discoverCartoonsStateToBrowseInput as discoverCartoonsStateToBrowseInputImpl,
  discoverCartoonsStateToFetchParams as discoverCartoonsStateToFetchParamsImpl,
  discoverTvShowsBrowse as discoverTvShowsBrowseImpl,
  discoverTvShowsFetchKey as discoverTvShowsFetchKeyImpl,
  discoverTvShowsStateToBrowseInput as discoverTvShowsStateToBrowseInputImpl,
  discoverTvShowsStateToFetchParams as discoverTvShowsStateToFetchParamsImpl,
  mapTmdbCartoonRowToShelfItem as mapTmdbCartoonRowToShelfItemImpl,
  mapTmdbTvShowRowToShelfItem as mapTmdbTvShowRowToShelfItemImpl,
  parseCartoonsDiscoverSearchParams as parseCartoonsDiscoverSearchParamsImpl,
  parseTvShowsDiscoverSearchParams as parseTvShowsDiscoverSearchParamsImpl,
  type CartoonsDiscoverState,
  type TvShowsDiscoverState,
} from './tmdb.browseVariants'
export type { CartoonsDiscoverState, TvShowsDiscoverState } from './tmdb.browseVariants'
import {
  discoverMoviesBrowse as discoverMoviesBrowseImpl,
  discoverSeriesBrowse as discoverSeriesBrowseImpl,
} from './tmdb.discoverBrowse'
import {
  enrichMovieShelfRuntime as enrichMovieShelfRuntimeImpl,
  enrichSeriesShelfRuntime as enrichSeriesShelfRuntimeImpl,
} from './tmdb.runtimeEnrichment'
import {
  getAcclaimedRecentMovies as getAcclaimedRecentMoviesImpl,
  getBestMoviesAllTime as getBestMoviesAllTimeImpl,
  getBestOf2026 as getBestOf2026Impl,
  getBestSeriesAllTime as getBestSeriesAllTimeImpl,
  getHeroItems as getHeroItemsImpl,
  getNewReleases as getNewReleasesImpl,
  getTrendingNow as getTrendingNowImpl,
} from './tmdb.homeFeeds'
import {
  getMoviePageDataShell as getMoviePageDataShellImpl,
  getMoviePageDataTailMovie as getMoviePageDataTailMovieImpl,
  getTvPageDataShell as getTvPageDataShellImpl,
  getTvPageDataTailTv as getTvPageDataTailTvImpl,
} from './tmdb.detailPages'
import {
  getPersonCombinedCredits as getPersonCombinedCreditsImpl,
  getPersonImages as getPersonImagesImpl,
  getPersonPageData as getPersonPageDataImpl,
  getPopularActors as getPopularActorsImpl,
  getTrendingPeopleForSitemap as getTrendingPeopleForSitemapImpl,
  type PersonCreditRowRaw,
  type PersonImageRow,
  type PersonPageDetail,
  type PopularActorItem,
} from './tmdb.people'
export type { PersonCreditRowRaw, PersonImageRow, PersonPageDetail, PopularActorItem } from './tmdb.people'
export type { TmdbGenreListItem } from './tmdb.search'
export { getImageUrl } from './tmdb.transport'
import {
  getMovieGenresList as getMovieGenresListImpl,
  getTvGenresList as getTvGenresListImpl,
  searchMovies as searchMoviesImpl,
  searchTvShows as searchTvShowsImpl,
  type TmdbGenreListItem,
} from './tmdb.search'
import { matchGenreLabelsFromKeywordResults, pickThematicKeywordLabel } from './tmdb.keywordGenres'
import { mergeGenresForShelf } from './tmdb.shelfMapping'
import { getImageUrl, hasTmdbApiKey, tmdbFetch } from './tmdb.transport'
import type {
  HeroItem,
  MovieBackdropStill,
  MoviePageCardItem,
  MoviePageCastMember,
  MoviePageCrewRef,
  MoviePageDetail,
  MoviePageDetailTailInput,
  MoviePageDetailTailPatch,
  MovieWatchProviderItem,
  MovieWatchProviderRow,
  MovieWatchProvidersUs,
  ShelfItem,
  TmdbDiscoverPage,
  TmdbRawMedia,
  TmdbVideosResponse,
  TmdbWatchCountry,
  TmdbWatchProviderRef,
  TmdbWatchProvidersPayload,
} from './tmdb.types'

export type {
  HeroItem,
  MovieBackdropStill,
  MoviePageCardItem,
  MoviePageCastMember,
  MoviePageDetail,
  MoviePageDetailTailInput,
  MovieWatchProvidersUs,
  ShelfItem,
} from './tmdb.types'

export { COMING_BLOCKBUSTER_MOVIE_VOTE_MIN, COMING_BLOCKBUSTER_TV_VOTE_MIN } from './tmdb.constants'

export {
  applyTrendingRecencyBias,
  compareShelfItemsByUpcomingReleaseAsc,
  isMainstreamTrendingMovie,
} from './tmdb.discoveryFilters'

/** Detail endpoints — list views omit full `genres` names, `runtime` / episode length. Chunked to ease TMDB load. */
async function enrichShelfItemsWithDetails(
  items: ShelfItem[],
  revalidate = TMDB_REVALIDATE_ENRICHMENT
): Promise<ShelfItem[]> {
  // chunkSize 16: doubles parallelism vs original 8, halving sequential round-trips.
  // Genre names and runtime are stable data — safe to fetch in larger parallel batches.
  const chunkSize = 16
  const out: ShelfItem[] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const done = await Promise.all(
      chunk.map((item) => enrichOneShelfItem(item, revalidate).catch(() => item))
    )
    out.push(...done)
  }
  return out.map(stripShelfGenreIds)
}

/**
 * 1) Map keywords → official genre names. 2) Else use a thematic keyword so the UI always has two chips when TMDB lists any keywords.
 */
async function padSecondGenreFromKeywords(
  kind: 'movie' | 'tv',
  id: number,
  genres: string[],
  revalidate = TMDB_REVALIDATE_DEFAULT
): Promise<string[]> {
  if (genres.length >= 2) return genres.slice(0, 2)
  try {
    const { results } = await tmdbFetch<{ results: { name: string }[] }>(
      `/${kind === 'tv' ? 'tv' : 'movie'}/${id}/keywords`,
      undefined,
      { revalidate }
    )
    const next = matchGenreLabelsFromKeywordResults(results, genres)
    if (next.length >= 2) return next.slice(0, 2)
    if (next.length === 1) {
      const thematic = pickThematicKeywordLabel(results, next[0]!)
      if (thematic) return [next[0]!, thematic]
    }
  } catch {
    /* keep single genre */
  }
  return genres.slice(0, 2)
}

async function enrichOneShelfItem(
  item: ShelfItem,
  revalidate = TMDB_REVALIDATE_DEFAULT
): Promise<ShelfItem> {
  if (item.type === 'movie' || item.type === 'cartoon') {
    try {
      const d = await tmdbFetch<{
        runtime?: number | null
        genres?: { name: string }[]
      }>(`/movie/${item.id}`, undefined, { revalidate })
      const runtimeMinutes = d.runtime != null && d.runtime > 0 ? d.runtime : null
      const detailNames = (d.genres ?? []).map((g) => g.name)
      let genres = mergeGenresForShelf(detailNames, item)
      genres = await padSecondGenreFromKeywords('movie', item.id, genres, revalidate)
      return { ...item, genres, runtimeMinutes }
    } catch {
      return item
    }
  }
  if (item.type === 'series' || item.type === 'tvshow') {
    try {
      const d = await tmdbFetch<{
        episode_run_time?: number[]
        last_episode_to_run?: {
          runtime?: number | null
          season_number?: number
          episode_number?: number
        }
        last_episode_to_air?: { air_date?: string; season_number?: number }
        first_air_date?: string
        number_of_seasons?: number
        genres?: { name: string }[]
      }>(`/tv/${item.id}`, undefined, { revalidate })
      const runtimeMinutes = await tvRuntimeWithEpisodeFallback(tmdbFetch, item.id, d, revalidate)
      const detailNames = (d.genres ?? []).map((g) => g.name)
      let genres = mergeGenresForShelf(detailNames, item)
      genres = await padSecondGenreFromKeywords('tv', item.id, genres, revalidate)
      return { ...item, genres, runtimeMinutes }
    } catch {
      return item
    }
  }
  return item
}

/** Title search for slug → id resolution on `/movie/[slug-year]`. */
export async function searchMovies(query: string, year?: number | null): Promise<TmdbRawMedia[]> {
  return searchMoviesImpl(tmdbFetch, query, TMDB_REVALIDATE_MODERATE, year)
}

export async function searchTvShows(query: string, year?: number | null): Promise<TmdbRawMedia[]> {
  return searchTvShowsImpl(tmdbFetch, query, TMDB_REVALIDATE_MODERATE, year)
}

// ── Movie detail page (`/movie/[id]`) ───────────────────

export { buildWatchProviderUrl } from './tmdb.watchProviders'

/** TMDB tail for movie detail: gallery, similar, collection rails (used by streamed below-fold RSC). */
export async function getMoviePageDataTailMovie(
  input: MoviePageDetailTailInput
): Promise<MoviePageDetailTailPatch> {
  return getMoviePageDataTailMovieImpl(input, {
    tmdbFetch,
    revalidateModerate: TMDB_REVALIDATE_MODERATE,
    mapRawToCardItem,
    enrichMoviePageCardItemsWithDetails,
    fetchDiscoverMoviesByGenresAndYears,
    pickRelevantSimilarItems,
  })
}

/** TMDB tail for TV detail: backdrop gallery + similar (no collection on TV template). */
export async function getTvPageDataTailTv(
  input: MoviePageDetailTailInput
): Promise<MoviePageDetailTailPatch> {
  return getTvPageDataTailTvImpl(input, {
    tmdbFetch,
    revalidateModerate: TMDB_REVALIDATE_MODERATE,
    mapRawToCardItem,
    enrichTvPageCardItemsWithDetails,
    tvRuntimeWithEpisodeFallback,
    fetchDiscoverTvByGenresAndYears,
    pickRelevantSimilarItems,
  })
}

 

/** Movie detail without gallery / similar / collection parts — faster shell for streaming + metadata. */
export async function getMoviePageDataShell(id: number): Promise<MoviePageDetail | null> {
  return getMoviePageDataShellImpl(id, {
    tmdbFetch,
    cacheTagMovie,
    revalidateModerate: TMDB_REVALIDATE_MODERATE,
    cacheTagMovies: CACHE_TAG_MOVIES,
    buildMovieCreditsMeta,
    buildWatchProvidersUs,
    buildWatchRows,
    buildWatchNowUrl,
    getImageUrl,
    mergeTmdbMovieVideoResults,
    pickPrimaryYoutubeVideo,
    pickHeroBackdropStillsForShell,
    pickAlternateDisplayTitle,
    formatMovieAgeRatingBadge,
  })
}

/** TV detail shell — no similar/images tail (streams in `MovieDetailStreamedBelowFold`). */
export async function getTvPageDataShell(id: number): Promise<MoviePageDetail | null> {
  return getTvPageDataShellImpl(id, {
    tmdbFetch,
    cacheTagTv,
    revalidateModerate: TMDB_REVALIDATE_MODERATE,
    buildTvCreditsMeta,
    buildWatchProvidersUs,
    buildWatchRows,
    buildWatchNowUrl,
    getImageUrl,
    mergeTmdbMovieVideoResults,
    pickPrimaryYoutubeVideo,
    pickHeroBackdropStillsForShell,
    pickAlternateDisplayTitle,
    formatTvContentRatingBadge,
    tvRuntimeWithEpisodeFallback,
  })
}

export async function getHeroItems(): Promise<HeroItem[]> {
  return getHeroItemsImpl({
    tmdbFetch,
    revalidateFast: TMDB_REVALIDATE_FAST,
    cacheTagTrending: CACHE_TAG_TRENDING,
    shelfExclude: SHELF_EXCLUDE,
    heroExclude: HERO_EXCLUDE,
    tvMovieGenreId: TV_MOVIE_GENRE_ID,
    genreNames: GENRE_NAMES,
    mergeUpToTwoGenres,
    pickTrailerKeyFromResults,
    isCombatSportsOrWrestlingProgram,
    passesShelfGenreFilter,
  })
}

export async function getBestOf2026(): Promise<ShelfItem[]> {
  return getBestOf2026Impl({
    tmdbFetch,
    mapToShelfItem,
    enrichShelfItemsWithDetails,
    revalidateModerate: TMDB_REVALIDATE_MODERATE,
    cacheTagHomeModerate: CACHE_TAG_HOME_MODERATE,
    shelfExclude: SHELF_EXCLUDE,
  })
}

export async function getTrendingNow(): Promise<ShelfItem[]> {
  return getTrendingNowImpl({
    tmdbFetch,
    mapToShelfItem,
    enrichShelfItemsWithDetails,
    revalidateFast: TMDB_REVALIDATE_FAST,
    cacheTagTrending: CACHE_TAG_TRENDING,
    isMainstreamTrendingMovie,
    applyTrendingRecencyBias,
  })
}

export async function getNewReleases(): Promise<ShelfItem[]> {
  return getNewReleasesImpl({
    tmdbFetch,
    mapToShelfItem,
    enrichShelfItemsWithDetails,
    revalidateFast: TMDB_REVALIDATE_FAST,
    cacheTagTrending: CACHE_TAG_TRENDING,
    shelfExclude: SHELF_EXCLUDE,
    isNewThisWeekMovie,
    isNewThisWeekSeries,
  })
}

/**
 * Homepage: **movies only** — recent releases, strong scores; junk stripped; **8 strict + 2 soft** in the
 * first ten when possible, then tail fill so the row can reach `limit` without disappearing.
 */
export async function getAcclaimedRecentMovies(limit = 20): Promise<ShelfItem[]> {
  return getAcclaimedRecentMoviesImpl(limit, {
    tmdbFetch,
    mapToShelfItem,
    enrichShelfItemsWithDetails,
    revalidateModerate: TMDB_REVALIDATE_MODERATE,
    shelfExclude: SHELF_EXCLUDE,
    isNewThisWeekMovie,
  })
}

export async function getBestMoviesAllTime(): Promise<ShelfItem[]> {
  return getBestMoviesAllTimeImpl({
    tmdbFetch,
    mapToShelfItem,
    enrichShelfItemsWithDetails,
    revalidateAllTime: TMDB_REVALIDATE_ALL_TIME,
    cacheTagAllTime: CACHE_TAG_ALL_TIME,
  })
}

export async function getBestSeriesAllTime(): Promise<ShelfItem[]> {
  return getBestSeriesAllTimeImpl({
    tmdbFetch,
    mapToShelfItem,
    enrichShelfItemsWithDetails,
    revalidateAllTime: TMDB_REVALIDATE_ALL_TIME,
    cacheTagAllTime: CACHE_TAG_ALL_TIME,
    shelfExclude: SHELF_EXCLUDE,
  })
}

// ── Popular people (homepage actor rail) ────────────────

export async function getPopularActors(limit = 100): Promise<PopularActorItem[]> {
  return getPopularActorsImpl(limit, {
    tmdbFetch,
    revalidatePeople: TMDB_REVALIDATE_PEOPLE,
    cacheTagPeople: CACHE_TAG_PEOPLE,
  })
}

export async function getPersonPageData(id: number): Promise<PersonPageDetail | null> {
  return getPersonPageDataImpl(id, {
    tmdbFetch,
    cacheTagPerson,
    revalidatePeople: TMDB_REVALIDATE_PEOPLE,
    mapPersonPageDetail,
  })
}

/** Profile photos from TMDB person images endpoint. */
export async function getPersonImages(personId: number): Promise<PersonImageRow[]> {
  return getPersonImagesImpl(personId, {
    tmdbFetch,
    cacheTagPerson,
    revalidatePeople: TMDB_REVALIDATE_PEOPLE,
    mapPersonImages,
  })
}

/** Cast credits from TMDB (sorted by popularity, capped). Paths are built in `@/lib/personCredits`. */
export async function getPersonCombinedCredits(personId: number): Promise<PersonCreditRowRaw[]> {
  return getPersonCombinedCreditsImpl(personId, {
    tmdbFetch,
    cacheTagPerson,
    revalidatePeople: TMDB_REVALIDATE_PEOPLE,
    mapPersonCombinedCredits,
  })
}

/** Trending people for sitemap union (dedupe with popular pool by id). */
export async function getTrendingPeopleForSitemap(limit = 48): Promise<PopularActorItem[]> {
  return getTrendingPeopleForSitemapImpl(limit, {
    tmdbFetch,
    revalidatePeople: TMDB_REVALIDATE_PEOPLE,
    mapTrendingPeople,
    hasApiKey: hasTmdbApiKey,
  })
}

// ── Movies discover browse (`/movies` + TMDB discover + `/api/discover`) ──

export async function getMovieGenresList(): Promise<TmdbGenreListItem[]> {
  return getMovieGenresListImpl(tmdbFetch, TMDB_REVALIDATE_ALL_TIME)
}

export type { WatchProviderListItem } from './tmdb.watchProviderLists'

export type { TmdbStudioListItem } from './tmdb.studios'

const movieRuntimeMinutesCache = new Map<number, number | null>()

/** Flatten US streaming/rent/buy rows for filter UI (TMDB nests by region). */
export async function getWatchProvidersMovieList(): Promise<WatchProviderListItem[]> {
  return getWatchProvidersMovieListImpl(tmdbFetch)
}

export async function getWatchProvidersTvList(): Promise<WatchProviderListItem[]> {
  return getWatchProvidersTvListImpl(tmdbFetch)
}

/**
 * Build a practical studio list for filter UI by sampling popular movie details.
 * TMDB has no simple "top studios" endpoint for discover filters.
 */
export async function getMovieStudiosList(limit = 40): Promise<TmdbStudioListItem[]> {
  return getMovieStudiosListImpl(tmdbFetch, limit)
}

export async function getTvGenresList(): Promise<TmdbGenreListItem[]> {
  return getTvGenresListImpl(tmdbFetch, TMDB_REVALIDATE_ALL_TIME)
}

export async function getSeriesStudiosList(limit = 40): Promise<TmdbStudioListItem[]> {
  return getSeriesStudiosListImpl(tmdbFetch, limit)
}

/** Normalized `/movies` discover state (shared by page, metadata, and `/api/discover`). */
export { moviesDiscoverActiveFilterKeys, parseMoviesDiscoverSearchParams } from './tmdb.moviesDiscoverState'
export type { MoviesDiscoverState } from './tmdb.moviesDiscoverState'
export {
  discoverFetchKey,
  discoverSeriesFetchKey,
  discoverSeriesStateToBrowseInput,
  discoverSeriesStateToFetchParams,
  discoverStateToBrowseInput,
  discoverStateToFetchParams,
} from './tmdb.discoverParams'
export type { DiscoverMoviesBrowseInput, DiscoverSeriesBrowseInput } from './tmdb.discoverParams'

export async function discoverMoviesBrowse(
  input: DiscoverMoviesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  return discoverMoviesBrowseImpl(
    input,
    mode,
    { tmdbFetch, discoverMovieYearBucketFeed },
    comingYear
  )
}


// ── Series discover browse (`/series` + TMDB discover + `/api/series-discover`) ──
export { parseSeriesDiscoverSearchParams, seriesDiscoverActiveFilterKeys } from './tmdb.seriesDiscoverState'
export type { SeriesDiscoverState } from './tmdb.seriesDiscoverState'

export async function discoverSeriesBrowse(
  input: DiscoverSeriesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  return discoverSeriesBrowseImpl(
    input,
    mode,
    { tmdbFetch, discoverSeriesYearBucketFeed },
    comingYear
  )
}


// ── Cartoons discover browse (`/cartoons` + TMDB discover + `/api/cartoons-discover`) ──

export function parseCartoonsDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): CartoonsDiscoverState {
  return parseCartoonsDiscoverSearchParamsImpl(sp)
}

export function discoverCartoonsStateToBrowseInput(
  state: CartoonsDiscoverState,
  page: number
): { input: DiscoverMoviesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  return discoverCartoonsStateToBrowseInputImpl(state, page)
}

export function discoverCartoonsStateToFetchParams(
  state: CartoonsDiscoverState
): Record<string, string> {
  return discoverCartoonsStateToFetchParamsImpl(state)
}

export function discoverCartoonsFetchKey(state: CartoonsDiscoverState): string {
  return discoverCartoonsFetchKeyImpl(state)
}

export async function discoverCartoonsBrowse(
  input: DiscoverMoviesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  return discoverCartoonsBrowseImpl(input, mode, { tmdbFetch, discoverMoviesBrowse }, comingYear)
}

export function mapTmdbCartoonRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return mapTmdbCartoonRowToShelfItemImpl(m, mapToShelfItem, stripShelfGenreIds)
}

export async function getTopCartoons2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  return getTopCartoons2026MosaicPosterUrlsImpl(maxUrls, {
    tmdbFetch,
    getImageUrl,
    cartoonWithoutGenres: CARTOON_WITHOUT_GENRES,
    tvMovieGenreId: TV_MOVIE_GENRE_ID,
  })
}

export function mapTmdbSeriesRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return stripShelfGenreIds(mapToShelfItem(m, 'series'))
}

export async function enrichSeriesShelfRuntime(items: ShelfItem[]): Promise<ShelfItem[]> {
  return enrichSeriesShelfRuntimeImpl(items, {
    tmdbFetch,
    tvRuntimeWithEpisodeFallback,
    defaultRevalidate: TMDB_REVALIDATE_DEFAULT,
  })
}

// ── TV Shows discover browse (`/tvshows` + TMDB discover + `/api/tvshows-discover`) ──

export function parseTvShowsDiscoverSearchParams(
  sp: Record<string, string | string[] | undefined>
): TvShowsDiscoverState {
  return parseTvShowsDiscoverSearchParamsImpl(sp)
}

export function discoverTvShowsStateToBrowseInput(
  state: TvShowsDiscoverState,
  page: number
): { input: DiscoverSeriesBrowseInput; mode: 'discover' | 'trending'; comingYear?: number } {
  return discoverTvShowsStateToBrowseInputImpl(
    state,
    page,
    TV_SHOW_ONLY_GENRE_SET,
    TV_SHOW_ONLY_WITH_GENRES
  )
}

export function discoverTvShowsStateToFetchParams(
  state: TvShowsDiscoverState
): Record<string, string> {
  return discoverTvShowsStateToFetchParamsImpl(state, TV_SHOW_ONLY_GENRE_SET)
}

export function discoverTvShowsFetchKey(state: TvShowsDiscoverState): string {
  return discoverTvShowsFetchKeyImpl(state, TV_SHOW_ONLY_GENRE_SET)
}

export function discoverTvShowsBrowse(
  input: DiscoverSeriesBrowseInput,
  mode: 'discover' | 'trending',
  comingYear?: number
): Promise<TmdbDiscoverPage<TmdbRawMedia>> {
  return discoverTvShowsBrowseImpl(input, mode, discoverSeriesBrowse, comingYear)
}

export function mapTmdbTvShowRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return mapTmdbTvShowRowToShelfItemImpl(m, mapToShelfItem, stripShelfGenreIds)
}

export function enrichTvShowsShelfRuntime(items: ShelfItem[]): Promise<ShelfItem[]> {
  return enrichSeriesShelfRuntime(items)
}

export async function getTopMovies2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  return getTopMovies2026MosaicPosterUrlsImpl(maxUrls, {
    tmdbFetch,
    discoverMoviesBrowse,
    getImageUrl,
    shelfExclude: SHELF_EXCLUDE,
    tvMovieGenreId: TV_MOVIE_GENRE_ID,
    passesShelfGenreFilter,
  })
}

export async function getTopSeries2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  return getTopSeries2026MosaicPosterUrlsImpl(maxUrls, {
    tmdbFetch,
    discoverSeriesBrowse,
    getImageUrl,
    shelfExclude: SHELF_EXCLUDE,
    tvMovieGenreId: TV_MOVIE_GENRE_ID,
    passesShelfGenreFilter,
  })
}

export async function getTopTvShows2026MosaicPosterUrls(maxUrls: number): Promise<string[]> {
  return getTopTvShows2026MosaicPosterUrlsImpl(maxUrls, {
    tmdbFetch,
    discoverSeriesBrowse,
    getImageUrl,
    tvShowOnlyWithGenres: TV_SHOW_ONLY_WITH_GENRES,
    tvShowOnlyGenreIds: TV_SHOW_ONLY_GENRE_IDS,
  })
}

/** Map a discover list row to a shelf card (no detail enrichment). */
export function mapTmdbMovieRowToShelfItem(m: TmdbRawMedia): ShelfItem {
  return stripShelfGenreIds(mapToShelfItem(m, 'movie'))
}

/**
 * Discover/list rows do not include runtime. This lightweight pass fetches
 * only movie runtime for current page cards so `/movies` can render duration.
 */
export async function enrichMovieShelfRuntime(items: ShelfItem[]): Promise<ShelfItem[]> {
  return enrichMovieShelfRuntimeImpl(items, { tmdbFetch, movieRuntimeMinutesCache })
}

// ── generateStaticParams helpers ─────────────────────────────────────────────
// Pre-render the most popular movie and series detail pages at build time.
// This converts them from Dynamic (ƒ) to Static (○/ISR), eliminating cold-start
// TTFB for the titles users are most likely to visit.
//
// Strategy: fetch top_rated + popular pages 1–5 (100 items each), dedupe by id,
// sort by popularity desc, return top N ids as slug strings.
// Cached at TMDB_REVALIDATE_ALL_TIME — these lists change slowly.

const STATIC_PARAMS_PAGES = 5 // pages 1–5 = up to 100 items per endpoint
const STATIC_PARAMS_LIMIT = 200 // final cap after dedup + sort

/**
 * Returns the top `limit` movie IDs (by popularity) for `generateStaticParams`.
 * Merges `/movie/top_rated` and `/movie/popular` to cover both critical acclaim
 * and current traffic — the union gives the best pre-render ROI.
 */
export async function getTopMovieIdsForStaticParams(
  limit = STATIC_PARAMS_LIMIT
): Promise<number[]> {
  return getTopMovieIdsForStaticParamsImpl(
    tmdbFetch,
    STATIC_PARAMS_PAGES,
    limit,
    TMDB_REVALIDATE_ALL_TIME
  )
}

/**
 * Returns the top `limit` TV series IDs (by popularity) for `generateStaticParams`.
 * Merges `/tv/top_rated` and `/tv/popular`.
 */
export async function getTopSeriesIdsForStaticParams(
  limit = STATIC_PARAMS_LIMIT
): Promise<number[]> {
  return getTopSeriesIdsForStaticParamsImpl(
    tmdbFetch,
    STATIC_PARAMS_PAGES,
    limit,
    TMDB_REVALIDATE_ALL_TIME
  )
}

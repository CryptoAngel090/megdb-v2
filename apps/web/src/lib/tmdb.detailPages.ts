import type { TmdbReleaseDatesPayload, TmdbTvContentRatingsPayload } from './tmdb.certifications'
import type {
  MovieBackdropStill,
  MoviePageCardItem,
  MoviePageDetail,
  MoviePageDetailTailInput,
  MoviePageDetailTailPatch,
  TmdbPaginated,
  TmdbRawMedia,
  TmdbVideosResponse,
  TmdbWatchCountry,
  TmdbWatchProvidersPayload,
} from './tmdb.types'
import type { TmdbBackdropImageRow } from './tmdb.movieDetailHelpers'

export async function getMoviePageDataTailMovie(
  input: MoviePageDetailTailInput,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    revalidateModerate: number
    mapRawToCardItem: (m: TmdbRawMedia) => MoviePageCardItem
    enrichMoviePageCardItemsWithDetails: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      items: MoviePageCardItem[],
      revalidate: number
    ) => Promise<MoviePageCardItem[]>
    fetchDiscoverMoviesByGenresAndYears: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      genreIds: number[],
      years: number[],
      excludeMovieId: number,
      revalidate: number
    ) => Promise<TmdbRawMedia[]>
    pickRelevantSimilarItems: (
      rows: TmdbRawMedia[],
      currentGenreIds: Set<number>,
      currentYear: number | null,
      animationGenreId: number
    ) => TmdbRawMedia[]
  }
): Promise<MoviePageDetailTailPatch> {
  const id = input.mediaId
  if (!Number.isFinite(id) || id <= 0) {
    return { similar: [], collection: null, backdropGallery: [] }
  }
  try {
    const [similarPage, imagesPayload, collectionPayload] = await Promise.all([
      deps
        .tmdbFetch<TmdbPaginated<TmdbRawMedia>>(`/movie/${id}/similar`, { page: '1' }, { revalidate: deps.revalidateModerate })
        .catch(() => null),
      deps
        .tmdbFetch<{
          backdrops?: Array<{ file_path: string; vote_average: number; width?: number; height?: number }>
        }>(`/movie/${id}/images`, undefined, { revalidate: deps.revalidateModerate })
        .catch(() => null),
      input.collectionTmdbId
        ? deps
            .tmdbFetch<{ id: number; name: string; parts?: TmdbRawMedia[] }>(
              `/collection/${input.collectionTmdbId}`,
              undefined,
              { revalidate: deps.revalidateModerate }
            )
            .catch(() => null)
        : Promise.resolve(null),
    ])

    const backdrops: MovieBackdropStill[] = (imagesPayload?.backdrops ?? [])
      .sort((a, b) => b.vote_average - a.vote_average)
      .map((b) => ({
        filePath: b.file_path,
        width: typeof b.width === 'number' && b.width > 0 ? b.width : 1280,
        height: typeof b.height === 'number' && b.height > 0 ? b.height : 720,
      }))

    const currentGenreIds = new Set(
      input.genreIds.filter((gid): gid is number => typeof gid === 'number' && Number.isFinite(gid))
    )
    const currentYear = input.releaseYear
    const [collection, similar] = await Promise.all([
      (async (): Promise<MoviePageDetail['collection']> => {
        if (!collectionPayload?.parts?.length) return null
        const rawParts = collectionPayload.parts.map(deps.mapRawToCardItem)
        const parts = await deps.enrichMoviePageCardItemsWithDetails(
          deps.tmdbFetch,
          rawParts,
          deps.revalidateModerate
        )
        if (parts.length <= 1) return null
        return {
          id: collectionPayload.id,
          name: collectionPayload.name?.trim() || 'Collection',
          parts,
        }
      })(),
      (async (): Promise<MoviePageCardItem[]> => {
        const discoverSimilarRaw =
          Number.isFinite(currentYear) && currentGenreIds.size > 0
            ? await deps.fetchDiscoverMoviesByGenresAndYears(
                deps.tmdbFetch,
                [...currentGenreIds],
                [currentYear as number, (currentYear as number) - 1],
                id,
                deps.revalidateModerate
              )
            : []
        const combinedSimilarRaw: TmdbRawMedia[] = (() => {
          const out: TmdbRawMedia[] = []
          const seen = new Set<number>()
          for (const m of [...(similarPage?.results ?? []), ...discoverSimilarRaw]) {
            if (!m?.id || m.id === id || seen.has(m.id)) continue
            seen.add(m.id)
            out.push(m)
          }
          return out
        })()
        const relevantSimilarRaw = deps.pickRelevantSimilarItems(
          combinedSimilarRaw,
          currentGenreIds,
          Number.isFinite(currentYear) ? currentYear : null,
          16
        )
        const similarBase = relevantSimilarRaw.map(deps.mapRawToCardItem)
        return deps.enrichMoviePageCardItemsWithDetails(
          deps.tmdbFetch,
          similarBase,
          deps.revalidateModerate
        )
      })(),
    ])
    return { similar, collection, backdropGallery: backdrops }
  } catch {
    return { similar: [], collection: null, backdropGallery: [] }
  }
}

export async function getTvPageDataTailTv(
  input: MoviePageDetailTailInput,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    revalidateModerate: number
    mapRawToCardItem: (m: TmdbRawMedia) => MoviePageCardItem
    enrichTvPageCardItemsWithDetails: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      tvRuntimeWithEpisodeFallback: (
        tmdbFetch: <T>(
          endpoint: string,
          params?: Record<string, string>,
          init?: { revalidate?: number; tags?: string[] }
        ) => Promise<T>,
        tvId: number,
        d: {
          episode_run_time?: number[]
          last_episode_to_run?: {
            runtime?: number | null
            season_number?: number
            episode_number?: number
          }
        },
        revalidate: number
      ) => Promise<number | null>,
      items: MoviePageCardItem[],
      revalidate: number
    ) => Promise<MoviePageCardItem[]>
    tvRuntimeWithEpisodeFallback: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      tvId: number,
      d: {
        episode_run_time?: number[]
        last_episode_to_run?: {
          runtime?: number | null
          season_number?: number
          episode_number?: number
        }
      },
      revalidate: number
    ) => Promise<number | null>
    fetchDiscoverTvByGenresAndYears: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      genreIds: number[],
      years: number[],
      excludeTvId: number,
      revalidate: number
    ) => Promise<TmdbRawMedia[]>
    pickRelevantSimilarItems: (
      rows: TmdbRawMedia[],
      currentGenreIds: Set<number>,
      currentYear: number | null,
      animationGenreId: number
    ) => TmdbRawMedia[]
  }
): Promise<MoviePageDetailTailPatch> {
  const id = input.mediaId
  if (!Number.isFinite(id) || id <= 0) {
    return { similar: [], collection: null, backdropGallery: [] }
  }
  try {
    const [similarPage, imagesPayload] = await Promise.all([
      deps
        .tmdbFetch<TmdbPaginated<TmdbRawMedia>>(`/tv/${id}/similar`, { page: '1' }, { revalidate: deps.revalidateModerate })
        .catch(() => null),
      deps
        .tmdbFetch<{
          backdrops?: Array<{ file_path: string; vote_average: number; width?: number; height?: number }>
        }>(`/tv/${id}/images`, undefined, { revalidate: deps.revalidateModerate })
        .catch(() => null),
    ])
    const backdrops: MovieBackdropStill[] = (imagesPayload?.backdrops ?? [])
      .sort((a, b) => b.vote_average - a.vote_average)
      .map((b) => ({
        filePath: b.file_path,
        width: typeof b.width === 'number' && b.width > 0 ? b.width : 1280,
        height: typeof b.height === 'number' && b.height > 0 ? b.height : 720,
      }))
    const currentGenreIds = new Set(
      input.genreIds.filter((gid): gid is number => typeof gid === 'number' && Number.isFinite(gid))
    )
    const currentYear = input.releaseYear
    const discoverSimilarRaw =
      Number.isFinite(currentYear) && currentGenreIds.size > 0
        ? await deps.fetchDiscoverTvByGenresAndYears(
            deps.tmdbFetch,
            [...currentGenreIds],
            [currentYear as number, (currentYear as number) - 1],
            id,
            deps.revalidateModerate
          )
        : []
    const combinedSimilarRaw: TmdbRawMedia[] = (() => {
      const out: TmdbRawMedia[] = []
      const seen = new Set<number>()
      for (const m of [...(similarPage?.results ?? []), ...discoverSimilarRaw]) {
        if (!m?.id || m.id === id || seen.has(m.id)) continue
        seen.add(m.id)
        out.push(m)
      }
      return out
    })()
    const relevantSimilarRaw = deps.pickRelevantSimilarItems(
      combinedSimilarRaw,
      currentGenreIds,
      Number.isFinite(currentYear) ? currentYear : null,
      16
    )
    const similarBase = relevantSimilarRaw.map(deps.mapRawToCardItem)
    const similar = await deps.enrichTvPageCardItemsWithDetails(
      deps.tmdbFetch,
      deps.tvRuntimeWithEpisodeFallback,
      similarBase,
      deps.revalidateModerate
    )
    return { similar, collection: null, backdropGallery: backdrops }
  } catch {
    return { similar: [], collection: null, backdropGallery: [] }
  }
}

export async function getMoviePageDataShell(
  id: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    cacheTagMovie: (id: number) => string
    revalidateModerate: number
    cacheTagMovies: string
    buildMovieCreditsMeta: (input: {
      crew:
        | Array<{ id: number; name: string; job: string }>
        | undefined
      cast:
        | Array<{ id: number; name: string; character?: string; profile_path: string | null; order: number }>
        | undefined
    }) => {
      directorRef: MoviePageDetail['director']
      directorNames: string[]
      writers: MoviePageDetail['writers']
      cast: MoviePageDetail['cast']
      starsForMeta: MoviePageDetail['starsForMeta']
    }
    buildWatchProvidersUs: (us: TmdbWatchCountry | undefined) => MoviePageDetail['watchProvidersUs']
    buildWatchRows: (us: TmdbWatchCountry | undefined) => MoviePageDetail['watchRows']
    buildWatchNowUrl: (providerId: number, title: string, fallbackUrl: string) => string
    getImageUrl: (path: string | null | undefined, size?: string) => string
    mergeTmdbMovieVideoResults: (
      primary: TmdbVideosResponse['results'],
      secondary: TmdbVideosResponse['results']
    ) => TmdbVideosResponse['results']
    pickPrimaryYoutubeVideo: (rows: TmdbVideosResponse['results']) => MoviePageDetail['trailer']
    pickHeroBackdropStillsForShell: (
      rows: TmdbBackdropImageRow[] | undefined,
      fallbackPath: string | null | undefined
    ) => MovieBackdropStill[]
    pickAlternateDisplayTitle: (
      altTitles: Array<{ iso_3166_1: string; title: string }> | undefined,
      currentTitle: string,
      originalTitle: string
    ) => string | null
    formatMovieAgeRatingBadge: (data: TmdbReleaseDatesPayload) => string | null
  }
): Promise<MoviePageDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  try {
    const movieTag = deps.cacheTagMovie(id)
    const d = await deps.tmdbFetch<{
      id: number
      title?: string
      original_title?: string
      tagline?: string | null
      overview?: string | null
      release_date?: string
      runtime?: number | null
      poster_path?: string | null
      backdrop_path?: string | null
      vote_average?: number
      vote_count?: number
      genres?: { id: number; name: string }[]
      homepage?: string | null
      imdb_id?: string | null
      budget?: number
      revenue?: number
      status?: string | null
      original_language?: string | null
      production_countries?: { iso_3166_1: string; name: string }[]
      production_companies?: { id: number; name: string }[]
      belongs_to_collection?: { id: number; name: string } | null
      credits?: {
        cast: Array<{ id: number; name: string; character?: string; profile_path: string | null; order: number }>
        crew: Array<{ id: number; name: string; job: string }>
      }
    }>(
      `/movie/${id}`,
      { append_to_response: 'credits', language: 'en-US' },
      { revalidate: deps.revalidateModerate, tags: [movieTag, deps.cacheTagMovies] }
    )
    const origLang = d.original_language?.trim().toLowerCase() ?? ''
    const fetchOrigVideos = origLang.length > 0 && origLang !== 'en' && origLang !== 'en-us'
    const rawImdbId = d.imdb_id?.trim() ? d.imdb_id.trim() : null
    const [providersPayload, releasePayload, altTitlesPayload, videosEnUs, videosOriginalLang, imagesPayload] =
      await Promise.all([
        deps
          .tmdbFetch<TmdbWatchProvidersPayload>(`/movie/${id}/watch/providers`, undefined, {
            revalidate: deps.revalidateModerate,
            tags: [movieTag, deps.cacheTagMovies],
          })
          .catch(() => null),
        deps
          .tmdbFetch<TmdbReleaseDatesPayload>(`/movie/${id}/release_dates`, undefined, {
            revalidate: deps.revalidateModerate,
            tags: [movieTag, deps.cacheTagMovies],
          })
          .catch(() => null),
        deps
          .tmdbFetch<{ titles?: Array<{ iso_3166_1: string; title: string }> }>(
            `/movie/${id}/alternative_titles`,
            undefined,
            { revalidate: deps.revalidateModerate, tags: [movieTag, deps.cacheTagMovies] }
          )
          .catch(() => null),
        deps
          .tmdbFetch<TmdbVideosResponse>(`/movie/${id}/videos`, { language: 'en-US' }, {
            revalidate: deps.revalidateModerate,
            tags: [movieTag, deps.cacheTagMovies],
          })
          .catch(() => ({ results: [] as TmdbVideosResponse['results'] })),
        fetchOrigVideos
          ? deps
              .tmdbFetch<TmdbVideosResponse>(`/movie/${id}/videos`, { language: d.original_language!.trim() }, {
                revalidate: deps.revalidateModerate,
                tags: [movieTag, deps.cacheTagMovies],
              })
              .catch(() => ({ results: [] as TmdbVideosResponse['results'] }))
          : Promise.resolve({ results: [] as TmdbVideosResponse['results'] }),
        deps
          .tmdbFetch<{ backdrops?: TmdbBackdropImageRow[] }>(`/movie/${id}/images`, undefined, {
            revalidate: deps.revalidateModerate,
            tags: [movieTag, deps.cacheTagMovies],
          })
          .catch(() => null),
      ])
    const { directorRef, directorNames, writers, cast, starsForMeta } = deps.buildMovieCreditsMeta({
      crew: d.credits?.crew,
      cast: d.credits?.cast,
    })
    const us = providersPayload?.results?.US
    const watchProvidersUs = deps.buildWatchProvidersUs(us)
    const watchRows = deps.buildWatchRows(us)
    const streamingNames = [
      ...(us?.flatrate ?? []).map((p) => p.provider_name),
      ...(us?.free ?? []).map((p) => p.provider_name),
    ]
    const justWatchLink = us?.link?.trim() ? us.link.trim() : null
    const watchNowProvider = us?.flatrate?.[0] ?? us?.free?.[0] ?? null
    const titleForWatch = d.title?.trim() || 'Untitled'
    const watchNowUrl = watchNowProvider
      ? deps.buildWatchNowUrl(watchNowProvider.provider_id, titleForWatch, justWatchLink ?? '#')
      : null
    const watchNowLogoUrl = watchNowProvider?.logo_path
      ? deps.getImageUrl(watchNowProvider.logo_path, 'w92')
      : null
    const mergedVideos = deps.mergeTmdbMovieVideoResults(videosEnUs.results, videosOriginalLang.results)
    const primary = deps.pickPrimaryYoutubeVideo(mergedVideos)
    const belongsToCollectionMeta =
      d.belongs_to_collection?.id != null
        ? { id: d.belongs_to_collection.id, name: d.belongs_to_collection.name?.trim() || 'Collection' }
        : null
    const heroBackdropStills = deps.pickHeroBackdropStillsForShell(imagesPayload?.backdrops, d.backdrop_path)
    const originalForAlt = d.original_title?.trim() || titleForWatch
    const alternateDisplayTitle = deps.pickAlternateDisplayTitle(
      altTitlesPayload?.titles,
      titleForWatch,
      originalForAlt
    )
    return {
      id: d.id,
      title: titleForWatch,
      originalTitle: d.original_title?.trim() || titleForWatch,
      tagline: d.tagline?.trim() ? d.tagline.trim() : null,
      overview: typeof d.overview === 'string' ? d.overview : '',
      releaseDate: d.release_date?.trim() ? d.release_date : null,
      runtime: d.runtime != null && d.runtime > 0 ? Math.round(d.runtime) : null,
      posterPath: d.poster_path ?? null,
      backdropPath: d.backdrop_path ?? null,
      voteAverage: d.vote_average ?? 0,
      voteCount: d.vote_count ?? 0,
      genres: (d.genres ?? []).filter((g) => g.name?.trim()).map((g) => ({ id: g.id, name: g.name.trim() })),
      homepage: d.homepage?.trim() ? d.homepage.trim() : null,
      imdbId: rawImdbId,
      budget: typeof d.budget === 'number' && d.budget > 0 ? d.budget : 0,
      revenue: typeof d.revenue === 'number' && d.revenue > 0 ? d.revenue : 0,
      status: d.status?.trim() ? d.status.trim() : null,
      originalLanguage: d.original_language?.trim() ? d.original_language.trim() : null,
      productionCountries: (d.production_countries ?? []).map((c) => ({ iso: c.iso_3166_1, name: c.name })),
      productionCompanies: (d.production_companies ?? []).map((c) => ({ id: c.id, name: c.name })),
      director: directorRef,
      directorNames,
      writers,
      starsForMeta,
      cast,
      trailerYoutubeKey: primary?.key ?? null,
      trailer: primary,
      ageRatingBadge: deps.formatMovieAgeRatingBadge(releasePayload),
      justWatchLink,
      watchRows,
      streamingNames,
      watchNowUrl,
      watchNowLogoUrl,
      watchNowProviderName: watchNowProvider?.provider_name ?? null,
      similar: [],
      collection: null,
      backdropGallery: [],
      heroBackdropStills,
      watchProvidersUs,
      alternateDisplayTitle,
      belongsToCollectionMeta,
    }
  } catch {
    return null
  }
}

export async function getTvPageDataShell(
  id: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    cacheTagTv: (id: number) => string
    revalidateModerate: number
    buildTvCreditsMeta: (input: {
      crew: Array<{ id: number; name: string; job: string }> | undefined
      cast:
        | Array<{ id: number; name: string; character?: string; profile_path: string | null; order: number }>
        | undefined
      createdBy: Array<{ id: number; name: string }> | undefined
    }) => {
      directorRef: MoviePageDetail['director']
      directorNames: string[]
      writers: MoviePageDetail['writers']
      cast: MoviePageDetail['cast']
      starsForMeta: MoviePageDetail['starsForMeta']
    }
    buildWatchProvidersUs: (us: TmdbWatchCountry | undefined) => MoviePageDetail['watchProvidersUs']
    buildWatchRows: (us: TmdbWatchCountry | undefined) => MoviePageDetail['watchRows']
    buildWatchNowUrl: (providerId: number, title: string, fallbackUrl: string) => string
    getImageUrl: (path: string | null | undefined, size?: string) => string
    mergeTmdbMovieVideoResults: (
      primary: TmdbVideosResponse['results'],
      secondary: TmdbVideosResponse['results']
    ) => TmdbVideosResponse['results']
    pickPrimaryYoutubeVideo: (rows: TmdbVideosResponse['results']) => MoviePageDetail['trailer']
    pickHeroBackdropStillsForShell: (
      rows: TmdbBackdropImageRow[] | undefined,
      fallbackPath: string | null | undefined
    ) => MovieBackdropStill[]
    pickAlternateDisplayTitle: (
      altTitles: Array<{ iso_3166_1: string; title: string }> | undefined,
      currentTitle: string,
      originalTitle: string
    ) => string | null
    formatTvContentRatingBadge: (data: TmdbTvContentRatingsPayload) => string | null
    tvRuntimeWithEpisodeFallback: (
      tmdbFetch: <T>(
        endpoint: string,
        params?: Record<string, string>,
        init?: { revalidate?: number; tags?: string[] }
      ) => Promise<T>,
      tvId: number,
      d: {
        episode_run_time?: number[]
        last_episode_to_run?: {
          runtime?: number | null
          season_number?: number
          episode_number?: number
        }
      },
      revalidate: number
    ) => Promise<number | null>
  }
): Promise<MoviePageDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  try {
    const tvTag = deps.cacheTagTv(id)
    const d = await deps.tmdbFetch<{
      id: number
      name?: string
      original_name?: string
      tagline?: string | null
      overview?: string | null
      first_air_date?: string
      poster_path?: string | null
      backdrop_path?: string | null
      vote_average?: number
      vote_count?: number
      genres?: { id: number; name: string }[]
      homepage?: string | null
      status?: string | null
      original_language?: string | null
      production_countries?: { iso_3166_1: string; name: string }[]
      production_companies?: { id: number; name: string }[]
      episode_run_time?: number[]
      created_by?: Array<{ id: number; name: string }>
      last_episode_to_run?: { runtime?: number | null; season_number?: number; episode_number?: number }
      credits?: {
        cast: Array<{ id: number; name: string; character?: string; profile_path: string | null; order: number }>
        crew: Array<{ id: number; name: string; job: string }>
      }
      external_ids?: { imdb_id?: string | null }
      seasons?: Array<{ season_number?: number; name?: string; episode_count?: number; air_date?: string | null }>
    }>(
      `/tv/${id}`,
      { append_to_response: 'credits,external_ids', language: 'en-US' },
      { revalidate: deps.revalidateModerate, tags: [tvTag] }
    )
    let rawImdbId = d.external_ids?.imdb_id?.trim() ? d.external_ids.imdb_id.trim() : null
    if (rawImdbId && /^\d+$/.test(rawImdbId)) rawImdbId = `tt${rawImdbId}`
    const origLang = d.original_language?.trim().toLowerCase() ?? ''
    const fetchOrigVideos = origLang.length > 0 && origLang !== 'en' && origLang !== 'en-us'
    const titleForWatch = d.name?.trim() || 'Untitled'
    const [providersPayload, contentRatingsPayload, altTitlesPayload, videosEnUs, videosOriginalLang, tvImagesPayload] =
      await Promise.all([
        deps
          .tmdbFetch<TmdbWatchProvidersPayload>(`/tv/${id}/watch/providers`, undefined, {
            revalidate: deps.revalidateModerate,
            tags: [tvTag],
          })
          .catch(() => null),
        deps
          .tmdbFetch<TmdbTvContentRatingsPayload>(`/tv/${id}/content_ratings`, undefined, {
            revalidate: deps.revalidateModerate,
            tags: [tvTag],
          })
          .catch(() => null),
        deps
          .tmdbFetch<{ titles?: Array<{ iso_3166_1: string; title: string }> }>(
            `/tv/${id}/alternative_titles`,
            undefined,
            { revalidate: deps.revalidateModerate, tags: [tvTag] }
          )
          .catch(() => null),
        deps
          .tmdbFetch<TmdbVideosResponse>(`/tv/${id}/videos`, { language: 'en-US' }, {
            revalidate: deps.revalidateModerate,
            tags: [tvTag],
          })
          .catch(() => ({ results: [] as TmdbVideosResponse['results'] })),
        fetchOrigVideos
          ? deps
              .tmdbFetch<TmdbVideosResponse>(`/tv/${id}/videos`, { language: d.original_language!.trim() }, {
                revalidate: deps.revalidateModerate,
                tags: [tvTag],
              })
              .catch(() => ({ results: [] as TmdbVideosResponse['results'] }))
          : Promise.resolve({ results: [] as TmdbVideosResponse['results'] }),
        deps
          .tmdbFetch<{ backdrops?: TmdbBackdropImageRow[] }>(`/tv/${id}/images`, undefined, {
            revalidate: deps.revalidateModerate,
            tags: [tvTag],
          })
          .catch(() => null),
      ])
    const { directorRef, directorNames, writers, cast, starsForMeta } = deps.buildTvCreditsMeta({
      crew: d.credits?.crew,
      cast: d.credits?.cast,
      createdBy: d.created_by,
    })
    const us = providersPayload?.results?.US
    const watchProvidersUs = deps.buildWatchProvidersUs(us)
    const watchRows = deps.buildWatchRows(us)
    const streamingNames = [
      ...(us?.flatrate ?? []).map((p) => p.provider_name),
      ...(us?.free ?? []).map((p) => p.provider_name),
    ]
    const justWatchLink = us?.link?.trim() ? us.link.trim() : null
    const watchNowProvider = us?.flatrate?.[0] ?? us?.free?.[0] ?? null
    const watchNowUrl = watchNowProvider
      ? deps.buildWatchNowUrl(watchNowProvider.provider_id, titleForWatch, justWatchLink ?? '#')
      : null
    const watchNowLogoUrl = watchNowProvider?.logo_path
      ? deps.getImageUrl(watchNowProvider.logo_path, 'w92')
      : null
    const mergedVideos = deps.mergeTmdbMovieVideoResults(videosEnUs.results, videosOriginalLang.results)
    const primary = deps.pickPrimaryYoutubeVideo(mergedVideos)
    const originalForAlt = d.original_name?.trim() || titleForWatch
    const alternateDisplayTitle = deps.pickAlternateDisplayTitle(
      altTitlesPayload?.titles,
      titleForWatch,
      originalForAlt
    )
    const runtime = await deps.tvRuntimeWithEpisodeFallback(deps.tmdbFetch, id, d, deps.revalidateModerate)
    const tvSeasonSummaries = (d.seasons ?? [])
      .filter(
        (
          s
        ): s is { season_number: number; name?: string; episode_count?: number; air_date?: string | null } =>
          typeof s?.season_number === 'number' && s.season_number > 0
      )
      .map((s) => ({
        seasonNumber: s.season_number,
        name: (() => {
          const raw = s.name?.trim() ?? ''
          const fallback = `Season ${s.season_number}`
          if (!raw || raw.toLowerCase() === fallback.toLowerCase()) return fallback
          return raw
        })(),
        episodeCount: typeof s.episode_count === 'number' ? s.episode_count : 0,
        airDate: s.air_date?.trim() ? s.air_date.trim() : null,
      }))
      .slice(0, 50)
    const heroBackdropStills = deps.pickHeroBackdropStillsForShell(tvImagesPayload?.backdrops, d.backdrop_path)
    return {
      id: d.id,
      title: titleForWatch,
      originalTitle: d.original_name?.trim() || titleForWatch,
      tagline: d.tagline?.trim() ? d.tagline.trim() : null,
      overview: typeof d.overview === 'string' ? d.overview : '',
      releaseDate: d.first_air_date?.trim() ? d.first_air_date : null,
      runtime,
      posterPath: d.poster_path ?? null,
      backdropPath: d.backdrop_path ?? null,
      voteAverage: d.vote_average ?? 0,
      voteCount: d.vote_count ?? 0,
      genres: (d.genres ?? []).filter((g) => g.name?.trim()).map((g) => ({ id: g.id, name: g.name.trim() })),
      homepage: d.homepage?.trim() ? d.homepage.trim() : null,
      imdbId: rawImdbId,
      budget: 0,
      revenue: 0,
      status: d.status?.trim() ? d.status.trim() : null,
      originalLanguage: d.original_language?.trim() ? d.original_language.trim() : null,
      productionCountries: (d.production_countries ?? []).map((c) => ({ iso: c.iso_3166_1, name: c.name })),
      productionCompanies: (d.production_companies ?? []).map((c) => ({ id: c.id, name: c.name })),
      director: directorRef,
      directorNames,
      writers,
      starsForMeta,
      cast,
      trailerYoutubeKey: primary?.key ?? null,
      trailer: primary,
      ageRatingBadge: deps.formatTvContentRatingBadge(contentRatingsPayload),
      justWatchLink,
      watchRows,
      streamingNames,
      watchNowUrl,
      watchNowLogoUrl,
      watchNowProviderName: watchNowProvider?.provider_name ?? null,
      similar: [],
      collection: null,
      backdropGallery: [],
      heroBackdropStills,
      watchProvidersUs,
      alternateDisplayTitle,
      tvSeasonSummaries,
    }
  } catch {
    return null
  }
}

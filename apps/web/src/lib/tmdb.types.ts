import type { MediaType } from '@repo/types'

export interface TmdbRawMedia {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count?: number
  popularity: number
  genre_ids?: number[]
}

export interface TmdbPaginated<T> {
  results: T[]
}

export interface TmdbDiscoverPage<T> extends TmdbPaginated<T> {
  page: number
  total_pages: number
  total_results: number
}

export interface TmdbVideosResponse {
  results: Array<{
    key: string
    site: string
    type: string
    official: boolean
    name?: string
    published_at?: string | null
  }>
}

export interface HeroItem {
  id: number
  type: 'movie' | 'series'
  title: string
  overview: string
  backdropPath: string
  voteAverage: number
  releaseDate: Date
  genres: string[]
  runtime: number | null
  trailerKey: string | null
  updatedAt?: Date | null
}

export interface ShelfItem {
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  overview?: string
  voteAverage: number
  releaseDate: Date | null
  popularity: number
  genres: string[]
  runtimeMinutes?: number | null
  updatedAt?: Date | null
  genreIds?: number[]
}

export interface TmdbWatchProviderRef {
  provider_id: number
  provider_name: string
  logo_path?: string | null
}

export interface TmdbWatchCountry {
  link?: string
  flatrate?: TmdbWatchProviderRef[]
  free?: TmdbWatchProviderRef[]
  rent?: TmdbWatchProviderRef[]
  buy?: TmdbWatchProviderRef[]
}

export interface TmdbWatchProvidersPayload {
  results?: Record<string, TmdbWatchCountry>
}

export interface MoviePageCastMember {
  id: number
  name: string
  character: string | null
  profilePath: string | null
}

export interface MovieWatchProviderRow {
  providerId: number
  name: string
  logoPath: string | null
  type: 'Stream' | 'Free' | 'Rent' | 'Buy'
  quality: string
}

export interface MoviePageCrewRef {
  id: number
  name: string
}

export interface MoviePageCardItem {
  id: number
  title: string
  posterPath: string | null
  releaseDate: string | null
  voteAverage: number
  genres?: string[]
  runtimeMinutes?: number | null
}

export interface MovieWatchProviderItem {
  providerId: number
  providerName: string
  logoPath: string | null
}

export interface MovieWatchProvidersUs {
  link: string | null
  stream: MovieWatchProviderItem[]
  rent: MovieWatchProviderItem[]
  buy: MovieWatchProviderItem[]
}

export interface MovieBackdropStill {
  filePath: string
  width: number
  height: number
}

export interface MoviePageDetail {
  id: number
  title: string
  originalTitle: string
  tagline: string | null
  overview: string
  releaseDate: string | null
  runtime: number | null
  posterPath: string | null
  blurHash?: string | null
  primaryColor?: string | null
  backdropPath: string | null
  voteAverage: number
  voteCount: number
  genres: { id: number; name: string }[]
  homepage: string | null
  imdbId: string | null
  budget: number
  revenue: number
  status: string | null
  originalLanguage: string | null
  productionCountries: { iso: string; name: string }[]
  productionCompanies: { id: number; name: string }[]
  director: MoviePageCrewRef | null
  directorNames: string[]
  writers: MoviePageCrewRef[]
  starsForMeta: MoviePageCrewRef[]
  cast: MoviePageCastMember[]
  trailerYoutubeKey: string | null
  trailer: {
    key: string
    name: string
    type: string
    publishedAt: string | null
  } | null
  ageRatingBadge: string | null
  justWatchLink: string | null
  watchRows: MovieWatchProviderRow[]
  streamingNames: string[]
  watchNowUrl: string | null
  watchNowLogoUrl: string | null
  watchNowProviderName: string | null
  similar: MoviePageCardItem[]
  collection: null | {
    id: number
    name: string
    parts: MoviePageCardItem[]
  }
  backdropGallery: MovieBackdropStill[]
  heroBackdropStills: MovieBackdropStill[]
  watchProvidersUs: MovieWatchProvidersUs | null
  alternateDisplayTitle: string | null
  tvSeasonSummaries?: Array<{
    seasonNumber: number
    name: string
    episodeCount: number
    airDate: string | null
  }>
  belongsToCollectionMeta?: { id: number; name: string } | null
}

export interface MoviePageDetailTailInput {
  mediaId: number
  genreIds: number[]
  releaseYear: number | null
  collectionTmdbId: number | null
}

export interface MoviePageDetailTailPatch {
  similar: MoviePageCardItem[]
  collection: MoviePageDetail['collection']
  backdropGallery: MovieBackdropStill[]
}

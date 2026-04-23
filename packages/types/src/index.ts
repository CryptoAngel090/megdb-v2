// ── Media ─────────────────────────────────────

export type MediaType = 'movie' | 'series' | 'cartoon' | 'tvshow'
export type UserRole = 'user' | 'admin'
export type ReactionType = 'like' | 'dislike'
export type WatchStatus = 'watching' | 'completed' | 'planned'

export interface Media {
  id: number
  tmdbId: number
  type: MediaType
  title: string
  originalTitle: string | null
  overview: string
  tagline: string | null
  posterPath: string | null
  backdropPath: string | null
  releaseDate: Date | null
  runtime: number | null
  voteAverage: number
  voteCount: number
  popularity: number
  status: string | null
  adult: boolean
}

// ── TMDB API ──────────────────────────────────

export interface TmdbMovie {
  id: number
  title: string
  original_title: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  genre_ids: number[]
  genres?: { id: number; name: string }[]
  media_type?: 'movie' | 'tv' | 'person'
}

export interface TmdbSeries {
  id: number
  name: string
  original_name: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  genres?: { id: number; name: string }[]
}

export interface TmdbPaginatedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

// ── API Response ──────────────────────────────

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: { code: string; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginationMeta {
  page: number
  totalPages: number
  totalItems: number
  perPage: number
}

// ── User ──────────────────────────────────────

export interface User {
  id: number
  email: string
  name: string
  avatarUrl: string | null
  role: UserRole
  createdAt: Date
}

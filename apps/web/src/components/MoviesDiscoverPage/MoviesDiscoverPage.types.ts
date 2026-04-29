import type {
  ShelfItem,
  TmdbGenreListItem,
  TmdbStudioListItem,
  WatchProviderListItem,
} from '@/lib/tmdb'

/** Server-derived browse state for `/movies` and discover variants. */
export interface DiscoverPageState {
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
  expectedYear?: number
  expectedMonth?: number
}

export interface RuntimeOption {
  value: string
  label: string
}

/** Query-shaped draft used by desktop URL pushes and mobile modal before apply. */
export interface MoviesFilterDraft {
  genre: string
  year: string
  sort: string
  provider: string
  studio: string
  rating: string
  language: string
  country: string
  runtime: string
  coming: string
  expected: string
}

export const EMPTY_MOVIES_FILTER_DRAFT: MoviesFilterDraft = {
  genre: '',
  year: '',
  sort: 'popularity.desc',
  provider: '',
  studio: '',
  rating: '',
  language: '',
  country: '',
  runtime: '',
  coming: '',
  expected: '',
}

export interface SavedPreset {
  id: string
  name: string
  draft: MoviesFilterDraft
  pinned?: boolean
}

export interface SuggestedPreset {
  name: string
  draft: MoviesFilterDraft
  pinned?: boolean
}

export interface DiscoverPagePayload {
  results: ShelfItem[]
  page: number
  total_pages: number
}

export interface ActiveChip {
  key: string
  label: string
  patch: Partial<MoviesFilterDraft>
}

export interface MoviesDiscoverPageProps {
  discoverState: DiscoverPageState
  genres: TmdbGenreListItem[]
  providers: WatchProviderListItem[]
  studios: TmdbStudioListItem[]
  fetchParams: Record<string, string>
  filterKey: string
  basePath: string
  apiPath: string
  pageTitle: string
  seoTitle?: string
  seoSubtitle?: string
  emptyText: string
  contentLabelPlural: string
  presetsStorageKey?: string
  runtimeFilterLabel?: string
  runtimeOptions?: RuntimeOption[]
  presetSuggestions?: SuggestedPreset[]
  initialItems: ShelfItem[]
  totalPages: number
  mosaicUrls: string[]
  heroDescription: string
  /** Movies `/movies` UX: focus trap, scroll restore, layout modes, TMDB trust line, hero LCP tile. */
  enableDiscoverPolish?: boolean
  /** Mobile-only poster grid columns. @default 2 */
  mobileGridColumns?: 2 | 3
  /** Pre-formatted timestamp (UTC), e.g. from the server render. */
  trustUpdatedAtLabel?: string
}

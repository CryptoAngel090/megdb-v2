import type { RuntimeOption } from './MoviesDiscoverPage.types'

export const LANG_OPTIONS = [
  { value: '', label: 'Any language' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
] as const

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'trending', label: 'Hype (trending)' },
  { value: 'top', label: 'Top rated' },
  { value: 'release_date.desc', label: 'Newest releases' },
  { value: 'vote_average.desc', label: 'Highest user score' },
  { value: 'original_title.asc', label: 'Title A–Z' },
]

export const COUNTRY_OPTIONS = [
  { value: '', label: 'Any country' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'IN', label: 'India' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
] as const

export const DEFAULT_RUNTIME_OPTIONS: RuntimeOption[] = [
  { value: '', label: 'Any duration' },
  { value: '0-90', label: 'Under 90 min' },
  { value: '90-120', label: '90–120 min' },
  { value: '120-150', label: '120–150 min' },
  { value: '150-999', label: '150+ min' },
]

export const DEFAULT_PRESETS_STORAGE_KEY = 'megdb-movies-filter-presets-v1'

export const PREFETCH_LOOKAHEAD_PAGES = 2

export const VIRTUOSO_OVERSCAN_PX = 900

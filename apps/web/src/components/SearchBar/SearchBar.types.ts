export interface SearchResult {
  id: number
  type: 'movie' | 'series' | 'person'
  title: string
  subtitle?: string
  posterPath?: string | null
  year?: string
}

export interface SearchBarProps {
  onFocus?: () => void
  onBlur?: () => void
  autoFocus?: boolean
}

export interface SearchApiResponse {
  results?: SearchResult[]
}

import type { SearchApiResponse, SearchResult } from './SearchBar.types'

export function isSearchApiResponse(value: unknown): value is SearchApiResponse {
  if (!value || typeof value !== 'object') {
    return false
  }
  if (!('results' in value)) {
    return true
  }

  const candidate = value as { results?: unknown }
  return candidate.results === undefined || Array.isArray(candidate.results)
}

export function searchResultTypeLabel(type: SearchResult['type']): string {
  if (type === 'movie') return 'Movie'
  if (type === 'series') return 'TV series'
  return 'Person'
}

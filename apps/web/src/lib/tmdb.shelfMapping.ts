import type { MediaType } from '@repo/types'
import { GENRE_NAMES } from './tmdb.constants'
import type { ShelfItem, TmdbRawMedia } from './tmdb.types'

export function mergeUpToTwoGenres(detailNames: string[], listLabels: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    const k = t.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    out.push(t)
  }
  for (const n of detailNames) push(n)
  if (out.length < 2) {
    for (const n of listLabels) {
      push(n)
      if (out.length >= 2) break
    }
  }
  return out
}

export function labelsFromGenreIds(ids: number[] | undefined): string[] {
  if (!ids?.length) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    const label = GENRE_NAMES[id]
    if (!label) continue
    const k = label.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(label)
  }
  return out
}

export function mapToShelfItem(item: TmdbRawMedia, type: MediaType): ShelfItem {
  const dateStr = item.release_date || item.first_air_date
  const genreIds = item.genre_ids ?? []
  const listLabels = labelsFromGenreIds(genreIds)
  const genres = mergeUpToTwoGenres([], listLabels)
  return {
    id: item.id,
    type,
    title: item.title ?? item.name ?? 'Untitled',
    posterPath: item.poster_path,
    overview: item.overview ?? '',
    voteAverage: item.vote_average,
    releaseDate: dateStr ? new Date(dateStr) : null,
    popularity: item.popularity,
    genres,
    genreIds,
  }
}

export function stripShelfGenreIds(item: ShelfItem): ShelfItem {
  const { genreIds, ...rest } = item
  void genreIds
  return rest
}

export function mergeGenresForShelf(detailNames: string[], item: ShelfItem): string[] {
  const fromIds = labelsFromGenreIds(item.genreIds)
  const listGenres = Array.isArray(item.genres) ? item.genres : []
  return mergeUpToTwoGenres(detailNames, [...fromIds, ...listGenres])
}

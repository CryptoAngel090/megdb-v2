import type { MediaType } from '@repo/types'

const LEGACY_MOVIE_KEY = 'megdb.watchlist.movies'
const WATCHLIST_KEY = 'megdb.watchlist.items.v1'

export interface LocalWatchlistItem {
  mediaId: number
  mediaType: MediaType
  title: string
  releaseDate: string | null
  addedAt: string
  pinned: boolean
  manualOrder: number | null
}

function parseLegacyMovieIds(raw: string | null): number[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is number => Number.isInteger(item) && item > 0)
  } catch {
    return []
  }
}

function isMediaType(value: unknown): value is MediaType {
  return value === 'movie' || value === 'series' || value === 'cartoon' || value === 'tvshow'
}

function parseWatchlist(raw: string | null): LocalWatchlistItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const rows: LocalWatchlistItem[] = []
    for (const item of parsed) {
      if (typeof item !== 'object' || item == null) continue
      const row = item as Record<string, unknown>
      if (!Number.isInteger(row.mediaId) || Number(row.mediaId) <= 0) continue
      if (!isMediaType(row.mediaType)) continue
      if (typeof row.title !== 'string' || row.title.trim() === '') continue
      if (!(typeof row.releaseDate === 'string' || row.releaseDate == null)) continue
      if (typeof row.addedAt !== 'string' || row.addedAt.trim() === '') continue
      rows.push({
        mediaId: Number(row.mediaId),
        mediaType: row.mediaType,
        title: row.title.trim(),
        releaseDate: row.releaseDate ?? null,
        addedAt: row.addedAt,
        pinned: row.pinned === true,
        manualOrder: Number.isFinite(row.manualOrder) ? Number(row.manualOrder) : null,
      })
    }
    return rows
  } catch {
    return []
  }
}

function dedupe(items: LocalWatchlistItem[]): LocalWatchlistItem[] {
  const map = new Map<string, LocalWatchlistItem>()
  for (const item of items) {
    map.set(`${item.mediaType}:${item.mediaId}`, item)
  }
  return [...map.values()].sort((a, b) => {
    const aOrder = a.manualOrder ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.manualOrder ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    if ((a.pinned === true) !== (b.pinned === true)) return a.pinned ? -1 : 1
    return b.addedAt.localeCompare(a.addedAt)
  })
}

export function getLocalWatchlistItems(): LocalWatchlistItem[] {
  if (typeof window === 'undefined') return []

  const migrated = parseWatchlist(window.localStorage.getItem(WATCHLIST_KEY))
  if (migrated.length > 0) return migrated

  // One-time migration from movie-only storage.
  const legacyMovieIds = parseLegacyMovieIds(window.localStorage.getItem(LEGACY_MOVIE_KEY))
  if (legacyMovieIds.length === 0) return []
  const now = new Date().toISOString()
  const migratedRows: LocalWatchlistItem[] = legacyMovieIds.map((mediaId, index) => ({
    mediaId,
    mediaType: 'movie',
    title: `Movie ${mediaId}`,
    releaseDate: null,
    addedAt: new Date(Date.now() - index * 1000).toISOString() || now,
    pinned: false,
    manualOrder: index,
  }))
  setLocalWatchlistItems(migratedRows)
  return migratedRows
}

function setLocalWatchlistItems(items: LocalWatchlistItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(dedupe(items)))
}

export function isInLocalWatchlist(mediaType: MediaType, mediaId: number): boolean {
  return getLocalWatchlistItems().some(
    (item) => item.mediaType === mediaType && item.mediaId === mediaId
  )
}

export function toggleLocalWatchlistItem(input: {
  mediaType: MediaType
  mediaId: number
  title: string
  releaseDate?: string | null
}): boolean {
  const current = getLocalWatchlistItems()
  const has = current.some(
    (item) => item.mediaType === input.mediaType && item.mediaId === input.mediaId
  )
  const next = has
    ? current.filter(
        (item) => !(item.mediaType === input.mediaType && item.mediaId === input.mediaId)
      )
    : [
        ...current,
        {
          mediaId: input.mediaId,
          mediaType: input.mediaType,
          title: input.title.trim() || `${input.mediaType} ${input.mediaId}`,
          releaseDate: input.releaseDate ?? null,
          addedAt: new Date().toISOString(),
          pinned: false,
          manualOrder: current.length,
        },
      ]
  setLocalWatchlistItems(next)
  return !has
}

export function removeLocalWatchlistItems(
  keys: Array<{ mediaType: MediaType; mediaId: number }>
): void {
  if (keys.length === 0) return
  const removal = new Set(keys.map((k) => `${k.mediaType}:${k.mediaId}`))
  const next = getLocalWatchlistItems().filter(
    (item) => !removal.has(`${item.mediaType}:${item.mediaId}`)
  )
  setLocalWatchlistItems(next)
}

export function clearLocalWatchlist(): void {
  setLocalWatchlistItems([])
}

export function toggleLocalWatchlistPinned(mediaType: MediaType, mediaId: number): boolean {
  const current = getLocalWatchlistItems()
  let nextPinned = false
  const next = current.map((item) => {
    if (item.mediaType !== mediaType || item.mediaId !== mediaId) return item
    nextPinned = !(item.pinned === true)
    return { ...item, pinned: nextPinned }
  })
  setLocalWatchlistItems(next)
  return nextPinned
}

export function moveLocalWatchlistItem(
  mediaType: MediaType,
  mediaId: number,
  direction: 'up' | 'down'
): void {
  const current = getLocalWatchlistItems()
  const key = `${mediaType}:${mediaId}`
  const idx = current.findIndex((item) => `${item.mediaType}:${item.mediaId}` === key)
  if (idx < 0) return
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= current.length) return
  const next = current.slice()
  const temp = next[idx]
  const target = next[swapWith]
  if (!temp || !target) return
  next[idx] = target
  next[swapWith] = temp
  const reindexed = next.map((item, order) => ({ ...item, manualOrder: order }))
  setLocalWatchlistItems(reindexed)
}

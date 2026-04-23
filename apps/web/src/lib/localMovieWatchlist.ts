const STORAGE_KEY = 'megdb.watchlist.movies'

function parseIds(raw: string | null): number[] {
  if (raw == null || raw === '') return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  } catch {
    return []
  }
}

export function getLocalMovieWatchlist(): number[] {
  if (typeof window === 'undefined') return []
  return parseIds(window.localStorage.getItem(STORAGE_KEY))
}

export function isMovieInLocalWatchlist(movieId: number): boolean {
  return getLocalMovieWatchlist().includes(movieId)
}

export function setLocalMovieWatchlist(ids: number[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}

/** @returns new membership (true = now in list) */
export function toggleLocalMovieWatchlist(movieId: number): boolean {
  const cur = getLocalMovieWatchlist()
  const has = cur.includes(movieId)
  const next = has ? cur.filter((id) => id !== movieId) : [...cur, movieId]
  setLocalMovieWatchlist(next)
  return !has
}

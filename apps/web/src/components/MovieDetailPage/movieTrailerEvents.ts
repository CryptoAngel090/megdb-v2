/** Dispatched on `window` so the hero (mobile) can open the trailer modal in `MovieTrailerBlock`. */
export const OPEN_MOVIE_TRAILER_EVENT = 'megdb:open-movie-trailer'
const OPEN_MOVIE_TRAILER_PENDING_KEY = 'megdb:open-movie-trailer:pending'

/** Queue trailer-open intent and dispatch immediately when listeners are ready. */
export function triggerMovieTrailerOpen(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(OPEN_MOVIE_TRAILER_PENDING_KEY, '1')
  } catch {
    // no-op: storage can be disabled in privacy modes
  }
  window.dispatchEvent(new CustomEvent(OPEN_MOVIE_TRAILER_EVENT))
}

/** Read-and-clear queued trailer-open intent (one-shot). */
export function consumePendingMovieTrailerOpen(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const pending = window.sessionStorage.getItem(OPEN_MOVIE_TRAILER_PENDING_KEY) === '1'
    if (pending) {
      window.sessionStorage.removeItem(OPEN_MOVIE_TRAILER_PENDING_KEY)
    }
    return pending
  } catch {
    return false
  }
}

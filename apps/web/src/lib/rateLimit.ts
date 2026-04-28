/**
 * Fixed 1-minute windows per client key (e.g. IP). In-memory — best-effort on a
 * single Node process; for multi-instance production use Redis/Upstash.
 */

type WindowEntry = { windowId: number; count: number }

const store = new Map<string, WindowEntry>()

const WINDOW_MS = 60_000

interface RateLimitResult {
  ok: boolean
  /** Seconds until the current window resets (when ok is false). */
  retryAfterSec?: number
}

export function checkRateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number = WINDOW_MS
): RateLimitResult {
  const now = Date.now()
  const windowId = Math.floor(now / windowMs)
  let entry = store.get(key)

  if (!entry || entry.windowId !== windowId) {
    entry = { windowId, count: 0 }
  }

  entry.count++
  store.set(key, entry)

  if (entry.count > maxPerWindow) {
    const windowEnd = (windowId + 1) * windowMs
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
    }
  }

  if (store.size > 20_000) {
    for (const k of store.keys()) {
      store.delete(k)
      if (store.size < 10_000) break
    }
  }

  return { ok: true }
}

export function getRequestIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

/** Normalized focal point as % of the image's natural width/height (for CSS object-position / transform-origin). */
export type PosterFocalPercent = { x: number; y: number }

type FaceDetectorCtor = new (opts?: {
  fastMode?: boolean
  maxDetectedFaces?: number
}) => {
  detect: (source: HTMLImageElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>
}

function clampPct(n: number): number {
  return Math.min(92, Math.max(8, n))
}

// ── sessionStorage cache ──────────────────────────────────────────────────────
// Key: `pfp:{img.src}` → JSON `{x,y}` or `"null"` (negative cache).
// Avoids re-running the canvas FaceDetector on every re-render / soft navigation.

const CACHE_PREFIX = 'pfp:'
const CACHE_NULL = 'null'

function cacheKey(src: string): string {
  return `${CACHE_PREFIX}${src}`
}

function readCache(src: string): PosterFocalPercent | null | undefined {
  try {
    const raw = sessionStorage.getItem(cacheKey(src))
    if (raw === null) return undefined // not cached yet
    if (raw === CACHE_NULL) return null // cached negative result
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'x' in parsed &&
      'y' in parsed &&
      typeof (parsed as PosterFocalPercent).x === 'number' &&
      typeof (parsed as PosterFocalPercent).y === 'number'
    ) {
      return parsed as PosterFocalPercent
    }
    return undefined
  } catch {
    return undefined
  }
}

function writeCache(src: string, value: PosterFocalPercent | null): void {
  try {
    sessionStorage.setItem(cacheKey(src), value === null ? CACHE_NULL : JSON.stringify(value))
  } catch {
    // sessionStorage full or unavailable — silently skip
  }
}

// ── Concurrency semaphore ─────────────────────────────────────────────────────
// FaceDetector is GPU/CPU-backed. Running >3 detections simultaneously on a
// mid-range phone causes frame drops and INP spikes during shelf scroll.

const MAX_CONCURRENT = 3
let _running = 0
const _queue: Array<() => void> = []

function acquireSemaphore(): Promise<void> {
  return new Promise((resolve) => {
    if (_running < MAX_CONCURRENT) {
      _running++
      resolve()
    } else {
      _queue.push(() => {
        _running++
        resolve()
      })
    }
  })
}

function releaseSemaphore(): void {
  _running = Math.max(0, _running - 1)
  const next = _queue.shift()
  if (next) next()
}

/**
 * Weighted centroid of detected faces (larger faces weigh more).
 * Runs fully in the browser; no TMDB/focal metadata required.
 *
 * Optimisations vs original:
 *  1. sessionStorage cache — result reused across re-renders and soft navigations.
 *     Negative results ("no faces") are also cached to skip redundant API calls.
 *  2. Concurrency semaphore — at most MAX_CONCURRENT (3) detections run at once,
 *     preventing GPU/CPU saturation on mid-range devices during shelf scroll.
 *
 * Returns `null` if the API is missing, fails (e.g. CORS), or no faces are found.
 */
export async function detectPosterFocalPoint(
  img: HTMLImageElement
): Promise<PosterFocalPercent | null> {
  if (typeof window === 'undefined') return null
  const Ctor = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector
  if (!Ctor || img.naturalWidth < 32 || img.naturalHeight < 32) return null

  // 1. Return cached result immediately — no detection needed
  const cached = readCache(img.src)
  if (cached !== undefined) return cached

  // 2. Acquire semaphore slot before running detection
  await acquireSemaphore()

  try {
    const detector = new Ctor({ fastMode: true, maxDetectedFaces: 8 })
    const faces = await detector.detect(img)

    if (!faces.length) {
      writeCache(img.src, null)
      return null
    }

    const iw = img.naturalWidth
    const ih = img.naturalHeight
    let px = 0
    let py = 0
    let wsum = 0

    for (const f of faces) {
      const b = f.boundingBox
      const a = Math.max(1, b.width * b.height)
      px += (b.x + b.width / 2) * a
      py += (b.y + b.height / 2) * a
      wsum += a
    }

    const result: PosterFocalPercent = {
      x: clampPct((px / wsum / iw) * 100),
      y: clampPct((py / wsum / ih) * 100),
    }

    writeCache(img.src, result)
    return result
  } catch {
    writeCache(img.src, null)
    return null
  } finally {
    releaseSemaphore()
  }
}

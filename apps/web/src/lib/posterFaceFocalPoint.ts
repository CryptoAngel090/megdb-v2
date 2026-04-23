/** Normalized focal point as % of the image’s natural width/height (for CSS object-position / transform-origin). */
export type PosterFocalPercent = { x: number; y: number }

type FaceDetectorCtor = new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect: (source: HTMLImageElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>
}

function clampPct(n: number): number {
  return Math.min(92, Math.max(8, n))
}

/**
 * Weighted centroid of detected faces (larger faces weigh more).
 * Runs fully in the browser; no TMDB/focal metadata required.
 * Returns `null` if the API is missing, fails (e.g. CORS), or no faces are found.
 */
export async function detectPosterFocalPoint(
  img: HTMLImageElement
): Promise<PosterFocalPercent | null> {
  if (typeof window === 'undefined') return null
  const Ctor = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector
  if (!Ctor || img.naturalWidth < 32 || img.naturalHeight < 32) return null

  try {
    const detector = new Ctor({ fastMode: true, maxDetectedFaces: 8 })
    const faces = await detector.detect(img)
    if (!faces.length) return null

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

    return {
      x: clampPct((px / wsum / iw) * 100),
      y: clampPct((py / wsum / ih) * 100),
    }
  } catch {
    return null
  }
}

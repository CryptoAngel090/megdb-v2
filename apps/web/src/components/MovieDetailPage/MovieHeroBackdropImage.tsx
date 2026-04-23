'use client'

import Image, { type ImageProps } from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PosterFocalPercent } from '@/lib/posterFaceFocalPoint'
import { detectPosterFocalPoint } from '@/lib/posterFaceFocalPoint'

export type MovieHeroBackdropImageProps = ImageProps & {
  /** When this string changes, focal point is recomputed (e.g. `${id}-backdrop-${path}`). */
  focalAssetKey: string
}

/**
 * Hero full-bleed image: after decode, runs browser Face Detection when available
 * and sets `object-position` so off-center subjects stay in frame on narrow viewports.
 */
export function MovieHeroBackdropImage({
  focalAssetKey,
  className,
  style,
  onLoadingComplete,
  ...rest
}: MovieHeroBackdropImageProps) {
  const [focal, setFocal] = useState<PosterFocalPercent | null>(null)
  const focalKeyRef = useRef(focalAssetKey)
  focalKeyRef.current = focalAssetKey

  useEffect(() => {
    setFocal(null)
  }, [focalAssetKey])

  const handleLoad = useCallback(
    (img: HTMLImageElement) => {
      onLoadingComplete?.(img)
      const k = focalAssetKey
      const run = () => {
        void detectPosterFocalPoint(img).then((p) => {
          if (p != null && k === focalKeyRef.current) setFocal(p)
        })
      }
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 2500 })
      } else {
        globalThis.setTimeout(run, 0)
      }
    },
    [focalAssetKey, onLoadingComplete]
  )

  const mergedStyle =
    focal != null ? { ...style, objectPosition: `${focal.x}% ${focal.y}%` } : style

  return (
    <Image {...rest} className={className} style={mergedStyle} onLoadingComplete={handleLoad} />
  )
}

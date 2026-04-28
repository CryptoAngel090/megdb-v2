'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { MovieBackdropStill } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MoviePhotosSection.module.css'

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

type Props = {
  images: MovieBackdropStill[]
  title: string
}

export function MoviePhotosSection({ images, title }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const validImages = images.filter((img) => Boolean(img.filePath?.trim()))

  const close = useCallback(() => setSelected(null), [])
  const prev = useCallback(() => {
    setSelected((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])
  const next = useCallback(() => {
    setSelected((i) => (i !== null && i < validImages.length - 1 ? i + 1 : i))
  }, [validImages.length])

  useEffect(() => {
    if (selected === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, close, prev, next])

  const scroll = (dir: 'left' | 'right') => {
    trackRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' })
  }

  if (!validImages.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.bar} aria-hidden />
          <ImageIcon className={[iconSlot.block, iconSlot.sm, styles.galleryIcon].filter(Boolean).join(' ')} aria-hidden />
          Photos
          <span className={styles.count}>{validImages.length}</span>
        </h2>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll left"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className={`${iconSlot.block} ${iconSlot.md}`} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll right"
            onClick={() => scroll('right')}
          >
            <ChevronRight className={`${iconSlot.block} ${iconSlot.md}`} aria-hidden />
          </button>
        </div>
      </div>

      <div ref={trackRef} className={styles.track}>
        {validImages.map((img, i) => (
          <button
            key={img.filePath}
            type="button"
            className={styles.thumb}
            onClick={() => setSelected(i)}
          >
            <Image
              src={getImageUrl(img.filePath, 'w500')}
              alt={`${title} — still ${i + 1}`}
              width={500}
              height={281}
              className={styles.thumbImg}
              placeholder="blur"
              blurDataURL={BLUR}
              priority={i < 6}
            />
          </button>
        ))}
      </div>

      {selected !== null && validImages[selected] != null && (
        <div className={styles.lightbox} onClick={close} role="presentation">
          <button type="button" className={styles.close} aria-label="Close" onClick={close}>
            <X className={`${iconSlot.block} ${iconSlot.sm}`} aria-hidden />
          </button>
          {selected > 0 && (
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowLeft}`}
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
            >
              <ChevronLeft className={`${iconSlot.block} ${iconSlot.md}`} aria-hidden />
            </button>
          )}
          {selected < validImages.length - 1 && (
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowRight}`}
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
            >
              <ChevronRight className={`${iconSlot.block} ${iconSlot.md}`} aria-hidden />
            </button>
          )}
          <div onClick={(e) => e.stopPropagation()} role="presentation">
            {(() => {
              const active = validImages[selected]
              if (!active) return null
              return (
                <Image
                  src={getImageUrl(active.filePath, 'w1280')}
                  alt={`${title} — still ${selected + 1} of ${validImages.length}`}
                  width={active.width}
                  height={active.height}
                  className={styles.lightboxImg}
                  priority
                />
              )
            })()}
          </div>
        </div>
      )}
    </section>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { MovieBackdropStill } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import styles from './MoviePhotosSection.module.css'

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function IconGallery({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function IconChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  )
}

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
          <IconGallery className={styles.galleryIcon ?? ''} />
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
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll right"
            onClick={() => scroll('right')}
          >
            <IconChevron dir="right" />
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
            <IconX />
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
              <IconChevron dir="left" />
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
              <IconChevron dir="right" />
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

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getImageUrl, type PersonImageRow } from '@/lib/tmdb'
import styles from './PersonPhotosRail.module.css'

interface PersonPhotosRailProps {
  personName: string
  images: PersonImageRow[]
}

export function PersonPhotosRail({ personName, images }: PersonPhotosRailProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<number | null>(null)

  if (images.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    trackRef.current?.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' })
  }
  const close = useCallback(() => setSelected(null), [])
  const prev = useCallback(() => {
    setSelected((index) => (index != null && index > 0 ? index - 1 : index))
  }, [])
  const next = useCallback(() => {
    setSelected((index) => (index != null && index < images.length - 1 ? index + 1 : index))
  }, [images.length])

  useEffect(() => {
    if (selected == null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') prev()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, close, prev, next])

  return (
    <section className={styles.section} aria-labelledby="person-photos-heading">
      <div className={styles.head}>
        <h2 id="person-photos-heading" className={styles.title}>
          Actor photos
          <span className={styles.count}>{images.length}</span>
        </h2>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll photos left"
            onClick={() => scroll('left')}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll photos right"
            onClick={() => scroll('right')}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div ref={trackRef} className={styles.track}>
        {images.map((image, index) => {
          const thumbSrc = getImageUrl(image.filePath, 'w342')
          return (
            <button
              key={image.filePath}
              type="button"
              className={`${styles.item} ${styles.photoLink}`}
              onClick={() => setSelected(index)}
              aria-label={`Open photo ${index + 1} of ${personName}`}
            >
              <Image
                src={thumbSrc}
                alt={`${personName} photo ${index + 1}`}
                width={image.width}
                height={image.height}
                className={styles.photo}
                sizes="(max-width: 767px) 40vw, (max-width: 1023px) 24vw, 180px"
              />
            </button>
          )
        })}
      </div>

      {selected != null && images[selected] != null ? (
        <div className={styles.lightbox} role="presentation" onClick={close}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label="Close photo viewer"
          >
            <X size={16} aria-hidden />
          </button>
          {selected > 0 ? (
            <button
              type="button"
              className={`${styles.arrowBtn} ${styles.arrowLeft}`}
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation()
                prev()
              }}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
          ) : null}
          {selected < images.length - 1 ? (
            <button
              type="button"
              className={`${styles.arrowBtn} ${styles.arrowRight}`}
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                next()
              }}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          ) : null}
          <div role="presentation" onClick={(event) => event.stopPropagation()}>
            {(() => {
              const active = images[selected]
              if (!active) return null
              return (
                <Image
                  src={getImageUrl(active.filePath, 'w1280')}
                  alt={`${personName} photo ${selected + 1} of ${images.length}`}
                  width={active.width}
                  height={active.height}
                  className={styles.lightboxImage}
                  priority
                />
              )
            })()}
          </div>
        </div>
      ) : null}
    </section>
  )
}

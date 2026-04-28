'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MoviePageCardItem } from '@/lib/tmdb'
import { detailPathForMedia, type DetailMediaKind } from '@/lib/slug'
import type { MediaType } from '@repo/types'
import { MediaCard } from '@/components/MediaCard/MediaCard'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MovieCollectionSection.module.css'

type Props = {
  title: string
  parts: MoviePageCardItem[]
  mediaKind?: DetailMediaKind
}

export function MovieCollectionSection({ title, parts, mediaKind = 'movie' }: Props) {
  const cardType = mediaKind as MediaType
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!parts.length) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 420 : -420, behavior: 'smooth' })
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleBar} aria-hidden />
          {title}
        </h2>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll left"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className={`${iconSlot.block} ${iconSlot.sm}`} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Scroll right"
            onClick={() => scroll('right')}
          >
            <ChevronRight className={`${iconSlot.block} ${iconSlot.sm}`} aria-hidden />
          </button>
        </div>
      </div>

      <div className={styles.trackWrap}>
        <div ref={scrollRef} className={styles.track}>
          <div className={styles.inner}>
            {parts.map((m) => (
              <div key={m.id}>
                <MediaCard
                  id={m.id}
                  type={cardType}
                  title={m.title}
                  posterPath={m.posterPath}
                  voteAverage={m.voteAverage}
                  releaseDate={m.releaseDate}
                  genres={m.genres ?? []}
                  runtimeMinutes={m.runtimeMinutes ?? null}
                  shelfReveal={false}
                  enablePointerMotion={false}
                  posterContext="shelf"
                  unifiedDiscoverMeta
                  layout="compact"
                  hideContextBadgeOnMobile
                  href={detailPathForMedia(mediaKind, m.title, m.releaseDate)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

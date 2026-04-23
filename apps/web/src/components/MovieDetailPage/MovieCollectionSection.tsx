'use client'

import { useRef } from 'react'
import type { MoviePageCardItem } from '@/lib/tmdb'
import { detailPathForMedia, type DetailMediaKind } from '@/lib/slug'
import type { MediaType } from '@repo/types'
import { MediaCard } from '@/components/MediaCard/MediaCard'
import styles from './MovieDetailPage.module.css'

function IconChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="16"
      height="16"
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
  title: string
  parts: MoviePageCardItem[]
  /** Default `movie` — use `series` / `tvshow` on TV detail pages. */
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
    <section className={styles.railSection}>
      <div className={styles.collectionHead}>
        <h2 className={styles.sectionHeading}>
          <span className={styles.sectionBar} aria-hidden />
          {title}
        </h2>
        <div className={styles.collectionNav}>
          <button
            type="button"
            className={styles.collectionNavBtn}
            aria-label="Scroll left"
            onClick={() => scroll('left')}
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            className={styles.collectionNavBtn}
            aria-label="Scroll right"
            onClick={() => scroll('right')}
          >
            <IconChevron dir="right" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className={styles.collectionTrack}>
        {parts.map((m) => (
          <div key={m.id} className={styles.collectionSlot}>
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
              posterContext="shelf"
              unifiedDiscoverMeta
              layout="compact"
              hideContextBadgeOnMobile
              href={detailPathForMedia(mediaKind, m.title, m.releaseDate)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

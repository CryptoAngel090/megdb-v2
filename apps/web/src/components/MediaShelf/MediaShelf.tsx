'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { MediaCard } from '@/components/MediaCard/MediaCard'
import { ShelfRevealShell } from '@/components/ShelfRevealShell/ShelfRevealShell'
import type { ShelfItem } from '@/lib/tmdb'
import type { CardSizeKey } from '@/theme/tokens/size'
// Spring animations removed per request — interactions now use instant or simple CSS transitions
import styles from './MediaShelf.module.css'

interface MediaShelfProps {
  title: string
  items: ShelfItem[]
  viewAllHref?: string
  /** Passed to cards: show full release date (day month year) instead of year only. */
  releaseDateDisplay?: 'year' | 'full'
  /** Passed to cards: e.g. homepage "Coming in …" — poster shows only centered release date. */
  posterBadges?: 'default' | 'comingDateOnly'
  /** Poster frame preset — `theme/tokens/size.ts` `cardSize`. @default 'md' */
  cardSize?: CardSizeKey
}

export function MediaShelf({
  title,
  items,
  viewAllHref,
  releaseDateDisplay,
  posterBadges,
  cardSize = 'md',
}: MediaShelfProps) {
  const shelfTitleId = useId()
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    const eps = 4
    setCanScrollLeft(scrollLeft > eps)
    setCanScrollRight(max > eps && scrollLeft < max - eps)
  }, [])

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    const ro = new ResizeObserver(() => updateScrollButtons())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      ro.disconnect()
    }
  }, [items, updateScrollButtons])

  const scrollRow = useCallback(
    (dir: -1 | 1) => {
      const el = rowRef.current
      if (!el) return
      const step = Math.max(280, el.clientWidth * 0.72)
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollBy({
        left: dir * step,
        behavior: prefersReduced ? 'auto' : 'smooth',
      })
      const bump = () => updateScrollButtons()
      if (prefersReduced) {
        queueMicrotask(bump)
        return
      }
      window.setTimeout(bump, 420)
      el.addEventListener('scrollend', bump, { once: true })
    },
    [updateScrollButtons]
  )
  const hasViewAll = Boolean(viewAllHref)

  const shelfBody = (
    <>
      <div className={`${styles.header} ${!hasViewAll ? styles.headerNoViewAll : ''}`}>
        <div className={styles.headerLeft}>
          <div className={styles.titleBlock}>
            <span className={styles.titleAccent} aria-hidden="true" />
            <h2 id={shelfTitleId} className={styles.title}>
              {title}
            </h2>
          </div>
        </div>
        <div className={styles.headerArrows}>
          <button
            type="button"
            className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
            aria-label={`Scroll ${title} left`}
            title={`Previous titles — ${title}`}
            disabled={!canScrollLeft}
            onClick={() => scrollRow(-1)}
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
            aria-label={`Scroll ${title} right`}
            title={`More titles — ${title}`}
            disabled={!canScrollRight}
            onClick={() => scrollRow(1)}
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
        <div className={styles.headerRight}>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className={styles.viewAll}
              aria-label={`See all titles in ${title}`}
            >
              <span className={styles.viewAllLabel}>See all</span>
              <span className={styles.viewAllIcon} aria-hidden="true">
                <svg className={styles.viewAllChevron} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className={styles.rowWrap}
        role="group"
        aria-label={`${title} — scroll horizontally to browse`}
      >
        <div ref={rowRef} className={styles.row}>
          <div className={styles.rowInner}>
            {items.map((item, i) => (
              <MediaCard
                key={item.id}
                {...item}
                listIndex={i}
                priority={i < 5}
                shelfReveal={false}
                enablePointerMotion={false}
                posterContext="shelf"
                layout="compact"
                unifiedDiscoverMeta
                hideContextBadgeOnMobile
                cardSize={cardSize}
                {...(releaseDateDisplay !== undefined ? { releaseDateDisplay } : {})}
                {...(posterBadges !== undefined ? { posterBadges } : {})}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <ShelfRevealShell
      outerClassName={styles.shelfOuter}
      innerClassName={styles.shelf}
      aria-labelledby={shelfTitleId}
    >
      {shelfBody}
    </ShelfRevealShell>
  )
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg className={styles.scrollChevron} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

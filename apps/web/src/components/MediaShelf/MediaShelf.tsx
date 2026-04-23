'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { MediaCard, MediaCardSkeleton } from '@/components/MediaCard/MediaCard'
import { ShelfRevealShell } from '@/components/ShelfRevealShell/ShelfRevealShell'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { shelfInViewOptions, shelfLinkTapSpring, shelfTapSpring } from '@/lib/shelfAnimations'
import styles from './MediaShelf.module.css'
import type { ShelfItem } from '@/lib/tmdb'

const MotionLink = motion(Link)

interface MediaShelfProps {
  title: string
  items: ShelfItem[]
  viewAllHref?: string
  /** Passed to cards: show full release date (day month year) instead of year only. */
  releaseDateDisplay?: 'year' | 'full'
  /** Passed to cards: e.g. homepage “Coming in …” — poster shows only centered release date. */
  posterBadges?: 'default' | 'comingDateOnly'
}

interface MediaShelfSkeletonProps {
  count?: number
}

export function MediaShelfSkeleton({ count = 10 }: MediaShelfSkeletonProps) {
  return (
    <section className={styles.shelf}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleBlock}>
            <div className={styles.skeletonAccent} aria-hidden />
            <div className={styles.skeletonTitleBar} aria-hidden />
          </div>
        </div>
        <div className={styles.headerArrows} aria-hidden="true">
          <div className={styles.skeletonScrollBtn} aria-hidden />
          <div className={styles.skeletonScrollBtn} aria-hidden />
        </div>
        <div className={styles.headerRight} aria-hidden="true" />
      </div>
      <div className={styles.rowWrap}>
        <div className={styles.row}>
          <div className={styles.rowInner}>
            {Array.from({ length: count }).map((_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function MediaShelf({
  title,
  items,
  viewAllHref,
  releaseDateDisplay,
  posterBadges,
}: MediaShelfProps) {
  const reduceMotion = usePrefersReducedMotion()
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

  const rowInView = useInView(rowRef, shelfInViewOptions)

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
          <motion.button
            type="button"
            className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
            aria-label={`Scroll ${title} left`}
            title={`Previous titles — ${title}`}
            disabled={!canScrollLeft}
            onClick={() => scrollRow(-1)}
            {...(!reduceMotion ? { whileTap: { scale: 0.9 } } : {})}
            transition={shelfTapSpring}
          >
            <ChevronIcon dir="left" />
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
            aria-label={`Scroll ${title} right`}
            title={`More titles — ${title}`}
            disabled={!canScrollRight}
            onClick={() => scrollRow(1)}
            {...(!reduceMotion ? { whileTap: { scale: 0.9 } } : {})}
            transition={shelfTapSpring}
          >
            <ChevronIcon dir="right" />
          </motion.button>
        </div>
        <div className={styles.headerRight}>
          {viewAllHref ? (
            <MotionLink
              href={viewAllHref}
              className={styles.viewAll}
              aria-label={`See all titles in ${title}`}
              {...(!reduceMotion ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.96 } } : {})}
              transition={shelfLinkTapSpring}
            >
              <span className={styles.viewAllLabel}>See all</span>
              <span className={styles.viewAllIcon} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </MotionLink>
          ) : null}
        </div>
      </div>

      <div
        className={styles.rowWrap}
        role="group"
        aria-label={`${title} — scroll horizontally to browse`}
      >
        <div ref={rowRef} className={styles.row}>
          {reduceMotion ? (
            <div className={styles.rowInner}>
              {items.map((item, i) => (
                <MediaCard
                  key={item.id}
                  {...item}
                  listIndex={i}
                  priority={i < 5}
                  shelfReveal={false}
                  posterContext="shelf"
                  layout="compact"
                  unifiedDiscoverMeta
                  hideContextBadgeOnMobile
                  {...(releaseDateDisplay !== undefined ? { releaseDateDisplay } : {})}
                  {...(posterBadges !== undefined ? { posterBadges } : {})}
                />
              ))}
            </div>
          ) : (
            <div className={styles.rowInner}>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={rowInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <MediaCard
                    {...item}
                    listIndex={i}
                    priority={i < 5}
                    shelfReveal={false}
                    posterContext="shelf"
                    layout="compact"
                    unifiedDiscoverMeta
                    hideContextBadgeOnMobile
                    {...(releaseDateDisplay !== undefined ? { releaseDateDisplay } : {})}
                    {...(posterBadges !== undefined ? { posterBadges } : {})}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <ShelfRevealShell
      outerClassName={styles.shelfOuter}
      innerClassName={styles.shelf}
      aria-labelledby={shelfTitleId}
      reduceMotion={reduceMotion}
    >
      {shelfBody}
    </ShelfRevealShell>
  )
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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

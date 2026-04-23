'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { PopularActorItem } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import {
  actorCardVariants,
  actorRowListVariants,
  actorTileTapSpring,
  shelfTapSpring,
} from '@/lib/shelfAnimations'
import { ShelfRevealShell } from '@/components/ShelfRevealShell/ShelfRevealShell'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import styles from './PopularActorsShelf.module.css'

interface PopularActorsShelfProps {
  actors: PopularActorItem[]
}

export function PopularActorsShelf({ actors }: PopularActorsShelfProps) {
  const reduceMotion = usePrefersReducedMotion()
  const titleId = useId()
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(max > 2 && scrollLeft < max - 2)
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
  }, [actors, updateScrollButtons])

  const scrollRow = useCallback((dir: -1 | 1) => {
    const el = rowRef.current
    if (!el) return
    const step = Math.max(280, el.clientWidth * 0.65)
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  if (actors.length === 0) return null

  const shelfBody = (
    <>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleBlock}>
            <span className={styles.titleAccent} aria-hidden="true" />
            <h2 id={titleId} className={styles.title}>
              100 Popular Actors
            </h2>
          </div>
        </div>
        <div className={styles.headerArrows}>
          <motion.button
            type="button"
            className={styles.scrollBtn}
            aria-label="Scroll popular actors left"
            disabled={!canScrollLeft}
            onClick={() => scrollRow(-1)}
            {...(!reduceMotion ? { whileTap: { scale: 0.9 } } : {})}
            transition={shelfTapSpring}
          >
            <Chevron dir="left" />
          </motion.button>
          <motion.button
            type="button"
            className={styles.scrollBtn}
            aria-label="Scroll popular actors right"
            disabled={!canScrollRight}
            onClick={() => scrollRow(1)}
            {...(!reduceMotion ? { whileTap: { scale: 0.9 } } : {})}
            transition={shelfTapSpring}
          >
            <Chevron dir="right" />
          </motion.button>
        </div>
        <div className={styles.headerRight} aria-hidden="true" />
      </div>

      <div
        className={styles.rowWrap}
        role="group"
        aria-label="Popular actors — scroll horizontally"
      >
        {reduceMotion ? (
          <div ref={rowRef} className={styles.row}>
            {actors.map((actor, i) => (
              <div key={actor.id} className={styles.cardMotionWrap}>
                <Link href={`/person/${actor.id}`} className={styles.card} title={actor.name}>
                  <div className={styles.avatarWrap}>
                    {actor.profilePath ? (
                      <Image
                        fill
                        className={styles.avatar}
                        src={getImageUrl(actor.profilePath, 'w342')}
                        alt=""
                        sizes="(max-width: 767px) 32vw, (max-width: 1279px) 18vw, 148px"
                        priority={i < 8}
                      />
                    ) : (
                      <span className={styles.placeholder} aria-hidden="true">
                        {actor.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className={styles.name}>{actor.name}</p>
                  {actor.department ? <p className={styles.dept}>{actor.department}</p> : null}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <motion.div ref={rowRef} className={styles.row} variants={actorRowListVariants}>
            {actors.map((actor, i) => (
              <motion.div
                key={actor.id}
                className={styles.cardMotionWrap}
                variants={actorCardVariants}
                whileTap={{ scale: 0.97 }}
                transition={{ scale: actorTileTapSpring }}
              >
                <Link href={`/person/${actor.id}`} className={styles.card} title={actor.name}>
                  <div className={styles.avatarWrap}>
                    {actor.profilePath ? (
                      <Image
                        fill
                        className={styles.avatar}
                        src={getImageUrl(actor.profilePath, 'w342')}
                        alt=""
                        sizes="(max-width: 767px) 32vw, (max-width: 1279px) 18vw, 148px"
                        priority={i < 8}
                      />
                    ) : (
                      <span className={styles.placeholder} aria-hidden="true">
                        {actor.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className={styles.name}>{actor.name}</p>
                  {actor.department ? <p className={styles.dept}>{actor.department}</p> : null}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  )

  return (
    <ShelfRevealShell
      outerClassName={styles.shelfOuter}
      innerClassName={styles.shelf}
      aria-labelledby={titleId}
      reduceMotion={reduceMotion}
    >
      {shelfBody}
    </ShelfRevealShell>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
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

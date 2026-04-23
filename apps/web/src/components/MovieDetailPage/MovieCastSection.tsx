'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { MoviePageCastMember } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { personPath } from '@/lib/slug'
import styles from './MovieCastSection.module.css'

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

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

function IconUsers({ className }: { className?: string | undefined }) {
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
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="3" />
      <path d="M20 21v-2a4 4 0 00-3-3.87" />
      <path d="M16.5 4.13a3 3 0 010 5.74" />
    </svg>
  )
}

type Props = {
  cast: MoviePageCastMember[]
  title?: string
}

export function MovieCastSection({ cast, title = 'Cast' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const castWithPhoto = cast.filter((actor) => Boolean(actor.profilePath))
  if (!castWithPhoto.length) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 480 : -480, behavior: 'smooth' })
  }

  return (
    <div className={styles.cqRoot}>
      <motion.section
        id="movie-cast"
        className={styles.section}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={containerVariants}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>
            <span className={styles.bar} aria-hidden />
            <IconUsers className={styles.castIcon ?? ''} />
            {title}
            <span className={styles.count}>{castWithPhoto.length}</span>
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
        <div ref={scrollRef} className={styles.track}>
          {castWithPhoto.map((actor) => {
            const photoUrl = getImageUrl(actor.profilePath, 'w185')
            return (
              <motion.div key={actor.id} variants={itemVariants} className={styles.card}>
                <Link href={personPath(actor.id, actor.name)} className={styles.cardInner}>
                  <div className={styles.cardBox}>
                    <div className={styles.photo}>
                      <Image
                        src={photoUrl}
                        alt={actor.name}
                        fill
                        sizes="(max-width: 640px) 120px, 140px"
                        className={styles.photoImg}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={BLUR}
                      />
                    </div>
                    <div className={styles.meta}>
                      <p className={styles.name}>{actor.name}</p>
                      {actor.character ? <p className={styles.char}>{actor.character}</p> : null}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
          <div className={styles.spacer} aria-hidden />
        </div>
      </motion.section>
    </div>
  )
}

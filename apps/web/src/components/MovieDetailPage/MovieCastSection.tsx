'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { MoviePageCastMember } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { PERSON_PROFILE_IMAGE_SIZES, PERSON_PROFILE_IMAGE_TMDB_SIZE } from '@/lib/imageSizes'
import { personPath } from '@/lib/slug'
import { EASE_SMOOTH } from '@/lib/shelfAnimations'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './MovieCastSection.module.css'

const BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** All cards fade in together — no stagger bounce, smooth and uniform. */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_SMOOTH } },
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
            <Users className={[iconSlot.block, iconSlot.sm, styles.castIcon].filter(Boolean).join(' ')} aria-hidden />
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
        <div ref={scrollRef} className={styles.track}>
          {castWithPhoto.map((actor) => {
            const photoUrl = getImageUrl(actor.profilePath, PERSON_PROFILE_IMAGE_TMDB_SIZE)
            return (
              <motion.div key={actor.id} variants={itemVariants} className={styles.card}>
                <Link href={personPath(actor.id, actor.name)} className={styles.cardInner}>
                  <div className={styles.cardBox}>
                    <div className={styles.photo}>
                      <Image
                        src={photoUrl}
                        alt={actor.name}
                        fill
                        sizes={PERSON_PROFILE_IMAGE_SIZES}
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

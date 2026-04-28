'use client'

import { useEffect, useState } from 'react'
import styles from './MovieUserRatingCard.module.css'

interface MovieUserRatingCardProps {
  movieId: number
  movieTitle: string
  /**
   * @default 'default' — `panel`: bordered block under actions.
   * `strip`: MegDB wordmark + score + stars in one row (primary summary next to TMDB).
   */
  variant?: 'default' | 'panel' | 'strip'
}

function getStorageKey(movieId: number): string {
  return `megdb:user-rating:movie:${movieId}`
}

export function MovieUserRatingCard({
  movieId,
  movieTitle,
  variant = 'default',
}: MovieUserRatingCardProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getStorageKey(movieId))
      const parsed = raw ? Number(raw) : 0
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
        setRating(parsed)
      }
    } catch {
      // localStorage can be unavailable in some browsing modes.
    }
  }, [movieId])

  function handleRate(nextRating: number): void {
    setRating(nextRating)
    try {
      window.localStorage.setItem(getStorageKey(movieId), String(nextRating))
    } catch {
      // Ignore storage failures, keep in-memory state.
    }
  }

  const activeRating = hoveredRating || rating

  const rootClass =
    variant === 'panel'
      ? `${styles.root} ${styles.rootPanel}`
      : variant === 'strip'
        ? `${styles.root} ${styles.rootStrip}`
        : styles.root

  if (variant === 'strip') {
    return (
      <div className={rootClass}>
        <div className={styles.stripRow}>
          <div className={styles.megdbBrand} aria-hidden>
            <svg className={styles.megdbPlay} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            <span className={styles.megdbWordmark}>
              <span className={styles.megdbMeg}>Meg</span>
              <span className={styles.megdbDb}>DB</span>
            </span>
          </div>
          <span className={styles.stripBrandSep} aria-hidden>
            —
          </span>
          <span className={styles.stripScore}>{rating > 0 ? `${rating}/5` : '—'}</span>
          <div
            className={styles.stripStars}
            role="radiogroup"
            aria-label={`Rate ${movieTitle} from 1 to 5 stars`}
            onMouseLeave={() => setHoveredRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= activeRating
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  className={`${styles.starButtonStrip} ${isActive ? styles.starButtonStripActive : ''}`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onFocus={() => setHoveredRating(star)}
                  onBlur={() => setHoveredRating(0)}
                  onClick={() => handleRate(star)}
                  aria-label={`Rate ${star} out of 5`}
                >
                  <svg viewBox="0 0 24 24" className={styles.starIconStrip} aria-hidden>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={rootClass}>
      <div className={styles.head}>
        <span className={styles.label}>Your rating</span>
        <span className={styles.value}>{rating > 0 ? `${rating}/5` : 'Not rated'}</span>
      </div>

      <div
        className={styles.stars}
        role="radiogroup"
        aria-label={`Rate ${movieTitle} from 1 to 5 stars`}
        onMouseLeave={() => setHoveredRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= activeRating
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              className={`${styles.starButton} ${isActive ? styles.starButtonActive : ''}`}
              onMouseEnter={() => setHoveredRating(star)}
              onFocus={() => setHoveredRating(star)}
              onBlur={() => setHoveredRating(0)}
              onClick={() => handleRate(star)}
              aria-label={`Rate ${star} out of 5`}
            >
              <svg viewBox="0 0 24 24" className={styles.starIcon} aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          )
        })}
      </div>

      {rating > 0 ? (
        <span className={styles.thankYou}>Thanks for your rating</span>
      ) : (
        <span className={styles.hint}>Tap stars to rate this movie.</span>
      )}
    </div>
  )
}

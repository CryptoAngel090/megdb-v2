// client: TMDB + MegDB rating strip wraps client star control
'use client'

import { TmdbLogoMark } from './TmdbLogoMark'
import { MovieUserRatingCard } from './MovieUserRatingCard'
import styles from './MoviePrimarySummaryPanel.module.css'

interface MoviePrimaryRatingsRowProps {
  tmdbDisplay: string
  movieId: number
  movieTitle: string
}

export function MoviePrimaryRatingsRow({
  tmdbDisplay,
  movieId,
  movieTitle,
}: MoviePrimaryRatingsRowProps) {
  const tmdbLabel =
    tmdbDisplay === '—'
      ? 'TMDB community average not available'
      : `TMDB community average ${tmdbDisplay}`

  return (
    <div className={styles.ratingsRow}>
      <div className={styles.tmdbLockup} role="status" aria-label={tmdbLabel}>
        <TmdbLogoMark className={styles.tmdbLogo ?? ''} />
        <span className={tmdbDisplay === '—' ? styles.tmdbScoreMuted : styles.tmdbScore}>
          {tmdbDisplay}
        </span>
      </div>
      <span className={styles.ratingsSep} aria-hidden>
        ·
      </span>
      <MovieUserRatingCard variant="strip" movieId={movieId} movieTitle={movieTitle} />
    </div>
  )
}

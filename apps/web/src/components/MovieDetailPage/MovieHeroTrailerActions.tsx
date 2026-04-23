'use client'

import { useCallback, useEffect, useState } from 'react'
import { isMovieInLocalWatchlist, toggleLocalMovieWatchlist } from '@/lib/localMovieWatchlist'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'
import { MovieShareButton } from './MovieShareButton'
import styles from './MovieDetailPage.module.css'

type Props = {
  movieId: number
  movieTitle: string
  hasTrailer: boolean
  embedTitle: string
}

function IconShare() {
  return (
    <svg
      className={styles.heroMobileTrailerIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path
        d="m8.59 13.51 6.83 3.98M15.41 6.49l-6.82 3.98"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCast() {
  return (
    <svg
      className={styles.heroMobileTrailerIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg
      className={styles.heroMobileTrailerIcon}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function HeroWatchlistButton({ movieId, movieTitle }: { movieId: number; movieTitle: string }) {
  const [inList, setInList] = useState(false)

  useEffect(() => {
    setInList(isMovieInLocalWatchlist(movieId))
  }, [movieId])

  const label = inList ? 'In watchlist' : 'Add to watchlist'

  return (
    <button
      type="button"
      className={`${styles.heroMobileTrailerBtnSecondary} ${inList ? styles.heroMobileTrailerBtnWatchlistOn : ''}`}
      onClick={() => {
        setInList(toggleLocalMovieWatchlist(movieId))
      }}
      aria-pressed={inList}
      aria-label={`${label} — ${movieTitle}`}
    >
      <IconBookmark filled={inList} />
      <span>{label}</span>
    </button>
  )
}

export function MovieHeroTrailerActions({ movieId, movieTitle, hasTrailer, embedTitle }: Props) {
  const openTrailer = () => {
    window.dispatchEvent(new CustomEvent(OPEN_MOVIE_TRAILER_EVENT))
  }

  const scrollToCast = useCallback(() => {
    const el = document.getElementById('movie-cast') ?? document.getElementById('movie-credits')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className={styles.heroMobileTrailerActions}>
      <div
        className={
          hasTrailer
            ? styles.heroMobileTrailerPrimaryRow
            : `${styles.heroMobileTrailerPrimaryRow} ${styles.heroMobileTrailerPrimaryRowSingle}`
        }
      >
        {hasTrailer ? (
          <>
            <button
              type="button"
              onClick={openTrailer}
              className={styles.heroMobileTrailerBtnPrimary}
              aria-label={`Watch trailer: ${embedTitle}`}
            >
              <svg
                className={styles.heroMobileTrailerIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Watch Trailer</span>
            </button>
            <HeroWatchlistButton movieId={movieId} movieTitle={movieTitle} />
          </>
        ) : (
          <HeroWatchlistButton movieId={movieId} movieTitle={movieTitle} />
        )}
      </div>

      <MovieShareButton
        title={movieTitle}
        unstyled
        className={styles.heroMobileTrailerBtnSecondary}
        icon={<IconShare />}
      />

      <button
        type="button"
        className={styles.heroMobileTrailerBtnSecondary}
        onClick={scrollToCast}
        aria-label={`Cast and credits for ${movieTitle}`}
      >
        <IconCast />
        <span>Cast</span>
      </button>
    </div>
  )
}

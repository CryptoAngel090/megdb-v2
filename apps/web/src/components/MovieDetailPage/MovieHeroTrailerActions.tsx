'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MediaType } from '@repo/types'
import { isInLocalWatchlist, toggleLocalWatchlistItem } from '@/lib/localWatchlist'
import { useToast } from '@/components/Toast/Toast'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'
import styles from './MovieDetailPage.module.css'

type Props = {
  movieId: number
  mediaType: MediaType
  movieTitle: string
  releaseDate: string | null
  hasTrailer: boolean
  embedTitle: string
}

function HeroWatchlistButton({
  movieId,
  mediaType,
  movieTitle,
  releaseDate,
}: {
  movieId: number
  mediaType: MediaType
  movieTitle: string
  releaseDate: string | null
}) {
  const [inList, setInList] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setInList(isInLocalWatchlist(mediaType, movieId))
  }, [mediaType, movieId])

  const label = inList ? 'In watchlist' : 'Add to watchlist'

  return (
    <button
      type="button"
      className={`${styles.heroMobileTrailerBtnSecondary} ${inList ? styles.heroMobileTrailerBtnWatchlistOn : ''}`}
      onClick={() => {
        const nextInList = toggleLocalWatchlistItem({
          mediaType,
          mediaId: movieId,
          title: movieTitle,
          releaseDate,
        })
        setInList(nextInList)
        if (nextInList) {
          toast.success(`Added "${movieTitle}" to watchlist`)
        } else {
          toast.info(`Removed "${movieTitle}" from watchlist`)
        }
      }}
      aria-pressed={inList}
      aria-label={`${label} — ${movieTitle}`}
    >
      <svg
        className={styles.heroMobileTrailerIcon}
        viewBox="0 0 24 24"
        fill={inList ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

function HeroNativeShareButton({
  movieTitle,
  className,
}: {
  movieTitle: string
  className?: string | undefined
}) {
  const toast = useToast()
  const onShare = useCallback(async () => {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: movieTitle, text: movieTitle, url })
      } catch {
        /* dismissed share sheet or share failed */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }, [movieTitle, toast])

  return (
    <button
      type="button"
      className={className ?? ''}
      onClick={() => void onShare()}
      aria-label={`Share ${movieTitle}`}
    >
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
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
      <span>Share</span>
    </button>
  )
}

export function MovieHeroTrailerActions({
  movieId,
  mediaType,
  movieTitle,
  releaseDate,
  hasTrailer,
  embedTitle,
}: Props) {
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
            <HeroWatchlistButton
              movieId={movieId}
              mediaType={mediaType}
              movieTitle={movieTitle}
              releaseDate={releaseDate}
            />
          </>
        ) : (
          <HeroWatchlistButton
            movieId={movieId}
            mediaType={mediaType}
            movieTitle={movieTitle}
            releaseDate={releaseDate}
          />
        )}
      </div>

      <HeroNativeShareButton movieTitle={movieTitle} className={styles.heroMobileTrailerBtnSecondary} />

      <button
        type="button"
        className={styles.heroMobileTrailerBtnSecondary}
        onClick={scrollToCast}
        aria-label={`Cast and credits for ${movieTitle}`}
      >
        <svg
          className={styles.heroMobileTrailerIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <span>Cast</span>
      </button>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MediaType } from '@repo/types'
import { Share2, Users, Bookmark } from 'lucide-react'
import { isInLocalWatchlist, toggleLocalWatchlistItem } from '@/lib/localWatchlist'
import { useToast } from '@/components/Toast/Toast'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'
import { MovieShareButton } from './MovieShareButton'
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
      <Bookmark
        className={styles.heroMobileTrailerIcon}
        fill={inList ? 'currentColor' : 'none'}
        aria-hidden
      />
      <span>{label}</span>
    </button>
  )
}

export function MovieHeroTrailerActions({ movieId, mediaType, movieTitle, releaseDate, hasTrailer, embedTitle }: Props) {
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
            <HeroWatchlistButton movieId={movieId} mediaType={mediaType} movieTitle={movieTitle} releaseDate={releaseDate} />
          </>
        ) : (
          <HeroWatchlistButton movieId={movieId} mediaType={mediaType} movieTitle={movieTitle} releaseDate={releaseDate} />
        )}
      </div>

      <MovieShareButton
        title={movieTitle}
        unstyled
        className={styles.heroMobileTrailerBtnSecondary}
        icon={<Share2 className={styles.heroMobileTrailerIcon} aria-hidden />}
      />

      <button
        type="button"
        className={styles.heroMobileTrailerBtnSecondary}
        onClick={scrollToCast}
        aria-label={`Cast and credits for ${movieTitle}`}
      >
        <Users className={styles.heroMobileTrailerIcon} aria-hidden />
        <span>Cast</span>
      </button>
    </div>
  )
}

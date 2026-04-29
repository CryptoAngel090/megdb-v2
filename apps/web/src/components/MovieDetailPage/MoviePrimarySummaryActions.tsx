'use client'

// client: watchlist toggle, trailer modal event, share popover, smooth scroll — same behavior as hero CTAs.

import type { MediaType } from '@repo/types'
import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/Toast/Toast'
import { isInLocalWatchlist, toggleLocalWatchlistItem } from '@/lib/localWatchlist'
import styles from './MoviePrimarySummaryPanel.module.css'
import { MovieShareButton } from './MovieShareButton'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'

interface MoviePrimarySummaryActionsProps {
  movieId: number
  mediaType: MediaType
  movieTitle: string
  releaseDate: string | null
  hasTrailer: boolean
  embedTitle: string
  watchNowUrl: string | null
  watchNowProviderName: string | null
  watchNowLogoUrl: string | null
}

function BookmarkIcon({
  className,
  filled,
}: {
  className?: string | undefined
  filled?: boolean | undefined
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
    </svg>
  )
}

function ClapperboardIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h16l-2 13H6L4 7z" />
      <path d="M6 7 4.5 4.5M10 7 8 4M14 7l-2-3M18 7l-1.5-2.5" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ShareIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
    </svg>
  )
}

export function MoviePrimarySummaryActions({
  movieId,
  mediaType,
  movieTitle,
  releaseDate,
  hasTrailer,
  embedTitle,
  watchNowUrl,
  watchNowProviderName,
  watchNowLogoUrl,
}: MoviePrimarySummaryActionsProps) {
  const [inList, setInList] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setInList(isInLocalWatchlist(mediaType, movieId))
  }, [mediaType, movieId])

  const openTrailer = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_MOVIE_TRAILER_EVENT))
  }, [])

  const scrollToCast = useCallback(() => {
    const el = document.getElementById('movie-cast') ?? document.getElementById('movie-credits')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const watchLabel = watchNowProviderName ? `Watch on ${watchNowProviderName}` : 'Watch now'

  return (
    <div className={styles.actionRow}>
      {watchNowUrl ? (
        <a
          href={watchNowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.watchFreeBtn}
        >
          {watchNowLogoUrl ? (
            <img
              src={watchNowLogoUrl}
              alt=""
              width={22}
              height={22}
              className={styles.watchFreeIcon}
            />
          ) : (
            <svg
              className={styles.watchFreeIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span>{watchLabel}</span>
        </a>
      ) : hasTrailer ? (
        <button type="button" className={styles.watchFreeBtn} onClick={openTrailer}>
          <svg className={styles.watchFreeIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Watch trailer</span>
        </button>
      ) : null}

      <div className={styles.iconGroup}>
        <button
          type="button"
          className={styles.iconCircleBtn}
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
          aria-label={
            inList ? `Remove ${movieTitle} from watchlist` : `Add ${movieTitle} to watchlist`
          }
        >
          <BookmarkIcon className={styles.iconGlyph} filled={inList} />
        </button>

        {hasTrailer && watchNowUrl ? (
          <button
            type="button"
            className={styles.iconCircleBtn}
            onClick={openTrailer}
            aria-label={`Watch trailer: ${embedTitle}`}
          >
            <ClapperboardIcon className={styles.iconGlyph} />
          </button>
        ) : null}

        <button
          type="button"
          className={styles.iconCircleBtn}
          onClick={scrollToCast}
          aria-label={`Cast and credits for ${movieTitle}`}
        >
          <UsersIcon className={styles.iconGlyph} />
        </button>

        <MovieShareButton
          title={movieTitle}
          unstyled
          iconOnly
          className={styles.iconCircleBtn}
          icon={<ShareIcon className={styles.iconGlyph} />}
        />
      </div>
    </div>
  )
}

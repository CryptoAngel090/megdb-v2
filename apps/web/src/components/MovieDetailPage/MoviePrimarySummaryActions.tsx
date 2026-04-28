'use client'

// client: watchlist toggle, trailer modal event, share popover, smooth scroll — same behavior as hero CTAs.

import { useCallback, useEffect, useState } from 'react'
import type { MediaType } from '@repo/types'
import { Bookmark, Clapperboard, Share2, Users } from 'lucide-react'
import { isInLocalWatchlist, toggleLocalWatchlistItem } from '@/lib/localWatchlist'
import { useToast } from '@/components/Toast/Toast'
import { MovieShareButton } from './MovieShareButton'
import { OPEN_MOVIE_TRAILER_EVENT } from './movieTrailerEvents'
import styles from './MoviePrimarySummaryPanel.module.css'

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
          <Bookmark
            className={styles.iconGlyph}
            fill={inList ? 'currentColor' : 'none'}
            aria-hidden
          />
        </button>

        {hasTrailer && watchNowUrl ? (
          <button
            type="button"
            className={styles.iconCircleBtn}
            onClick={openTrailer}
            aria-label={`Watch trailer: ${embedTitle}`}
          >
            <Clapperboard className={styles.iconGlyph} aria-hidden />
          </button>
        ) : null}

        <button
          type="button"
          className={styles.iconCircleBtn}
          onClick={scrollToCast}
          aria-label={`Cast and credits for ${movieTitle}`}
        >
          <Users className={styles.iconGlyph} aria-hidden />
        </button>

        <MovieShareButton
          title={movieTitle}
          unstyled
          iconOnly
          className={styles.iconCircleBtn}
          icon={<Share2 className={styles.iconGlyph} aria-hidden />}
        />
      </div>
    </div>
  )
}

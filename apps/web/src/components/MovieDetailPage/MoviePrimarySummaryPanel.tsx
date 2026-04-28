import Link from 'next/link'
import type { MediaType } from '@repo/types'
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import type { MoviePageDetail } from '@/lib/tmdb'
import { personPath } from '@/lib/slug'
import { MovieOverviewBlock } from './MovieOverviewBlock'
import { MoviePrimaryRatingsRow } from './MoviePrimaryRatingsRow'
import { MoviePrimarySummaryActions } from './MoviePrimarySummaryActions'
import styles from './MoviePrimarySummaryPanel.module.css'

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`
  return `$${n.toLocaleString()}`
}

interface MoviePrimarySummaryPanelProps {
  movie: MoviePageDetail
  mediaType: MediaType
  displayOverview: string
  releaseDateFull: string | null
  runtimeLabel: string | null
  showBoxOffice: boolean
  trailerEmbedTitle: string
  trailerKey: string | null
  /** Fallback when genre id has no hub slug; same as `MovieDetailPage` hero links. @default '/movies?genre=' */
  genreQueryPrefix?: string
}

/** Primary strip: TMDB community score + local user rating; metadata and actions. */
export function MoviePrimarySummaryPanel({
  movie,
  mediaType,
  displayOverview,
  releaseDateFull,
  runtimeLabel,
  showBoxOffice,
  trailerEmbedTitle,
  trailerKey,
  genreQueryPrefix = '/movies?genre=',
}: MoviePrimarySummaryPanelProps) {
  const tmdbReliable = movie.voteCount >= 10
  const tmdbDisplay = movie.voteAverage > 0 && tmdbReliable ? movie.voteAverage.toFixed(1) : '—'

  const hasTrailer = Boolean(trailerKey)

  const metaPieces: string[] = []
  if (movie.ageRatingBadge) metaPieces.push(movie.ageRatingBadge)
  if (releaseDateFull) metaPieces.push(releaseDateFull)
  if (runtimeLabel) metaPieces.push(runtimeLabel)
  const boxOfficeLine =
    showBoxOffice && movie.revenue > 0 ? `Box office: ${formatMoney(movie.revenue)}` : null

  const genreShow = movie.genres.slice(0, 3)
  const genreOverflow = movie.genres.length > 3
  const hasGenreLinks = genreShow.length > 0
  const showMetaLine = metaPieces.length > 0 || hasGenreLinks

  return (
    <section className={styles.bleed} aria-labelledby="movie-primary-summary-title">
      <div className={styles.inner}>
        <h2 id="movie-primary-summary-title" className={styles.title}>
          {movie.title.replace(/["""''«»]/g, '')}
        </h2>

        {movie.director ? (
          <p className={styles.director}>
            Directed by{' '}
            <Link
              href={personPath(movie.director.id, movie.director.name)}
              className={styles.directorLink}
            >
              {movie.director.name}
            </Link>
          </p>
        ) : null}

        {showMetaLine ? (
          <p className={styles.metaPlain}>
            {metaPieces.map((piece, i) => (
              <span key={`m-${i}`} className={styles.metaRun}>
                {i > 0 ? (
                  <span className={styles.metaSep} aria-hidden>
                    ·
                  </span>
                ) : null}
                {piece}
              </span>
            ))}
            {hasGenreLinks ? (
              <span className={styles.metaRun}>
                {metaPieces.length > 0 ? (
                  <span className={styles.metaSep} aria-hidden>
                    ·
                  </span>
                ) : null}
                {genreShow.map((g, gi) => (
                  <span key={g.id}>
                    {gi > 0 ? <span className={styles.metaInlineSep}>, </span> : null}
                    <Link
                      href={movieGenrePathById(String(g.id)) ?? `${genreQueryPrefix}${g.id}`}
                      className={styles.metaGenreLink}
                    >
                      {g.name}
                    </Link>
                  </span>
                ))}
                {genreOverflow ? <span className={styles.metaGenreTail}>, and more</span> : null}
              </span>
            ) : null}
          </p>
        ) : null}
        {boxOfficeLine ? <p className={styles.metaSecondary}>{boxOfficeLine}</p> : null}

        <MoviePrimaryRatingsRow
          tmdbDisplay={tmdbDisplay}
          movieId={movie.id}
          movieTitle={movie.title}
        />

        <MoviePrimarySummaryActions
          movieId={movie.id}
          mediaType={mediaType}
          movieTitle={movie.title}
          releaseDate={movie.releaseDate}
          hasTrailer={hasTrailer}
          embedTitle={trailerEmbedTitle}
          watchNowUrl={movie.watchNowUrl}
          watchNowProviderName={movie.watchNowProviderName}
          watchNowLogoUrl={movie.watchNowLogoUrl}
        />

        <div className={styles.synopsis}>
          <h3 className={styles.synopsisHeading}>Synopsis</h3>
          <MovieOverviewBlock text={displayOverview} />
        </div>
      </div>
    </section>
  )
}

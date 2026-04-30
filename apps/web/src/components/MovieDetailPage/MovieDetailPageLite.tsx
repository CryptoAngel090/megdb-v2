import Image from 'next/image'
import Link from 'next/link'
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import type { DetailMediaKind } from '@/lib/slug'
import type { MoviePageDetail } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import { MovieCastSection } from './MovieCastSection'
import styles from './MovieDetailPage.styles'
import { MovieFaqAccordion } from './MovieFaqAccordion'

interface MovieDetailPageLiteProps {
  movie: MoviePageDetail
  similarMediaKind?: DetailMediaKind
  genreQueryPrefix?: string
}

export function MovieDetailPageLite({
  movie,
  similarMediaKind = 'movie',
  genreQueryPrefix = '/movies?genre=',
}: MovieDetailPageLiteProps) {
  const posterSrc = movie.posterPath ? getImageUrl(movie.posterPath, 'w500') : null
  const year = movie.releaseDate?.slice(0, 4) ?? 'TBA'
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null

  const faqItems = [
    {
      question: `Where can I watch ${movie.title}?`,
      answer:
        movie.streamingNames.length > 0
          ? `${movie.title} is available on ${movie.streamingNames.join(', ')} depending on your region.`
          : `Streaming availability for ${movie.title} varies by region.`,
    },
    ...(movie.overview.trim()
      ? [{ question: `What is ${movie.title} about?`, answer: movie.overview.trim() }]
      : []),
  ]

  return (
    <div id="movie-detail-page" className={styles.page}>
      <div id="movie-page-primary" className={styles.container}>
        <section className={styles.overviewBlock} aria-labelledby="movie-detail-title">
          <div className={styles.twoCol}>
            <aside className={styles.desktopSidebar}>
              {posterSrc && (
                <Image
                  src={posterSrc}
                  alt={`${movie.title} poster`}
                  width={240}
                  height={360}
                  className={styles.sidebarPoster}
                  sizes="240px"
                />
              )}
            </aside>
            <div className={styles.main}>
              <h1 id="movie-detail-title" className={styles.heroTitle}>
                {movie.title}
              </h1>
              <p className={styles.heroMeta}>
                <span>{year}</span>
                {runtime ? (
                  <>
                    <span className={styles.metaDot}>·</span>
                    <span>{runtime}</span>
                  </>
                ) : null}
                {movie.voteAverage > 0 ? (
                  <>
                    <span className={styles.metaDot}>·</span>
                    <span>TMDB {movie.voteAverage.toFixed(1)}/10</span>
                  </>
                ) : null}
              </p>
              {movie.genres.length > 0 ? (
                <p className={styles.watchLead}>
                  {movie.genres.map((genre, index) => (
                    <span key={genre.id}>
                      {index > 0 ? ', ' : ''}
                      <Link
                        href={
                          movieGenrePathById(String(genre.id)) ?? `${genreQueryPrefix}${genre.id}`
                        }
                        className={styles.metaGenreLink}
                      >
                        {genre.name}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
              {movie.overview.trim() ? (
                <p className={styles.overview}>{movie.overview.trim()}</p>
              ) : null}
            </div>
          </div>
        </section>

        <MovieCastSection cast={movie.cast} />
        {faqItems.length > 0 ? (
          <MovieFaqAccordion items={faqItems} movieTitle={movie.title} />
        ) : null}
      </div>
    </div>
  )
}

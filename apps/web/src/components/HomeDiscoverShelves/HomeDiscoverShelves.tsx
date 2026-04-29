import Link from 'next/link'
import { MediaShelf } from '@/components/MediaShelf/MediaShelf'
import { PopularActorsShelf } from '@/components/PopularActorsShelf/PopularActorsShelf'
import {
  getAcclaimedRecentMovies,
  getBestMoviesAllTime,
  getBestOf2026,
  getBestSeriesAllTime,
  getNewReleases,
  getPopularActors,
  getTrendingNow,
} from '@/lib/tmdb'
import styles from './HomeDiscoverShelves.module.css'

interface HomeDiscoverShelvesProps {
  className: string
}

/**
 * Below-the-fold homepage shelves — streamed behind `<Suspense>` so the hero shell
 * can flush before these TMDB aggregates finish.
 */
export async function HomeDiscoverShelves({ className }: HomeDiscoverShelvesProps) {
  const [
    bestOf2026,
    trendingNow,
    newReleases,
    acclaimedRecent,
    bestMovies,
    bestSeries,
    popularActors,
  ] = await Promise.all([
    getBestOf2026().catch(() => []),
    getTrendingNow().catch(() => []),
    getNewReleases().catch(() => []),
    getAcclaimedRecentMovies().catch(() => []),
    getBestMoviesAllTime().catch(() => []),
    getBestSeriesAllTime().catch(() => []),
    getPopularActors(100).catch(() => []),
  ])

  const hasAnyShelf =
    bestOf2026.length +
      trendingNow.length +
      newReleases.length +
      acclaimedRecent.length +
      bestMovies.length +
      bestSeries.length +
      popularActors.length >
    0

  if (!hasAnyShelf) {
    const missingTmdbKey = !process.env.TMDB_API_KEY?.trim()
    return (
      <div className={`${className} ${styles.fallback}`.trim()} role="status">
        <h2 className={styles.fallbackTitle}>Discovery is offline</h2>
        <p className={styles.fallbackBody}>
          {missingTmdbKey
            ? 'No TMDB API key. Add TMDB_API_KEY to apps/web/.env.local or the repo root .env.local (see apps/web/.env.example), restart the dev server, then reload.'
            : 'Movie and TV feeds did not return any rows (TMDB error, rate limit, or network). Try again in a moment or browse manually.'}
        </p>
        <nav className={styles.fallbackNav} aria-label="Browse MegDB">
          <Link className={styles.fallbackLink} href="/movies">
            Movies
          </Link>
          <Link className={styles.fallbackLink} href="/series">
            Series
          </Link>
          <Link className={styles.fallbackLink} href="/cartoons">
            Cartoons
          </Link>
          <Link className={styles.fallbackLink} href="/tvshows">
            TV Shows
          </Link>
          <Link className={styles.fallbackLink} href="/search">
            Search
          </Link>
        </nav>
      </div>
    )
  }

  return (
    <div className={className}>
      {bestOf2026.length > 0 && (
        <MediaShelf title="Best of 2026" items={bestOf2026} viewAllHref="/movies?year=2026" />
      )}
      {trendingNow.length > 0 && (
        <MediaShelf title="Trending Now" items={trendingNow} viewAllHref="/movies?sort=trending" />
      )}
      {newReleases.length > 0 && (
        <MediaShelf title="New This Week" items={newReleases} viewAllHref="/movies" />
      )}
      {acclaimedRecent.length > 0 && (
        <MediaShelf
          title="Best New Movies"
          items={acclaimedRecent}
          viewAllHref="/movies?sort=acclaimed"
        />
      )}
      {bestMovies.length > 0 && (
        <MediaShelf
          title="Best Movies of All Time"
          items={bestMovies}
          viewAllHref="/movies?sort=top"
        />
      )}
      {bestSeries.length > 0 && (
        <MediaShelf
          title="Best Series of All Time"
          items={bestSeries}
          viewAllHref="/series?sort=top"
        />
      )}
      {popularActors.length > 0 && <PopularActorsShelf actors={popularActors} />}
    </div>
  )
}

import type { Metadata } from 'next'
import { HeroSection } from '@/components/HeroSection/HeroSection'
import { MediaShelf } from '@/components/MediaShelf/MediaShelf'
import { PopularActorsShelf } from '@/components/PopularActorsShelf/PopularActorsShelf'
import {
  getHeroItems,
  getBestOf2026,
  getTrendingNow,
  getNewReleases,
  getAcclaimedRecentMovies,
  getBestMoviesAllTime,
  getBestSeriesAllTime,
  getPopularActors,
} from '@/lib/tmdb'
import styles from './page.module.css'

/** 15m — must be ≤ fastest homepage TMDB tier so the route re-runs often enough for `fetch` caches to refresh. */
export const revalidate = 900

/** Homepage-only SEO — overrides root `layout` title template for `/` */
export const metadata: Metadata = {
  title: {
    absolute: 'MegDB — Trending movies & TV, new releases and all-time favorites',
  },
  description:
    'Browse trending movies and series, new this week, 2026 highlights, and coming soon picks. Explore top-rated films and shows and decide what to watch next.',
  openGraph: {
    title: 'MegDB — Trending movies & TV, new releases and all-time favorites',
    description:
      'Browse trending movies and series, new releases, and top-rated picks. Find what to watch next on MegDB.',
    type: 'website',
  },
}

export default async function HomePage() {
  const [
    heroItems,
    bestOf2026,
    trendingNow,
    newReleases,
    acclaimedRecent,
    bestMovies,
    bestSeries,
    popularActors,
  ] = await Promise.all([
    getHeroItems().catch(() => []),
    getBestOf2026().catch(() => []),
    getTrendingNow().catch(() => []),
    getNewReleases().catch(() => []),
    getAcclaimedRecentMovies().catch(() => []),
    getBestMoviesAllTime().catch(() => []),
    getBestSeriesAllTime().catch(() => []),
    getPopularActors(100).catch(() => []),
  ])

  return (
    <>
      {heroItems.length > 0 && <HeroSection slides={heroItems} />}

      <div className={styles.page}>
        {bestOf2026.length > 0 && (
          <MediaShelf title="Best of 2026" items={bestOf2026} viewAllHref="/movies?year=2026" />
        )}
        {trendingNow.length > 0 && (
          <MediaShelf
            title="Trending Now"
            items={trendingNow}
            viewAllHref="/movies?sort=trending"
          />
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
    </>
  )
}

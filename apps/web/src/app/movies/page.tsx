import type { Metadata } from 'next'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getMoviesDiscoverCanonicalPath,
  getMoviesDiscoverDescription,
  getMoviesDiscoverHeroLead,
  getMoviesDiscoverKeywords,
  getMoviesDiscoverTitle,
} from '@/lib/moviesDiscoverCopy'
import { buildCollectionPageJsonLd } from '@/lib/jsonLdSite'
import { discoverSocialMeta } from '@/lib/seoSocial'
import {
  discoverMoviesBrowse,
  discoverFetchKey,
  discoverStateToFetchParams,
  discoverStateToBrowseInput,
  enrichMovieShelfRuntime,
  getMovieGenresList,
  getMovieStudiosList,
  getTopMovies2026MosaicPosterUrls,
  getWatchProvidersMovieList,
  mapTmdbMovieRowToShelfItem,
  moviesDiscoverActiveFilterKeys,
  parseMoviesDiscoverSearchParams,
} from '@/lib/tmdb'
import styles from './page.module.css'

export const revalidate = 600

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const state = parseMoviesDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  const needsGenres = genreOnly || (state.genre != null && keys.length > 1)
  const needsProviders = keys.includes('provider')
  const needsStudios = keys.includes('studio')

  const [allGenresRaw, providers, studios] = await Promise.all([
    needsGenres ? getMovieGenresList().catch(() => []) : Promise.resolve([]),
    needsProviders ? getWatchProvidersMovieList().catch(() => []) : Promise.resolve([]),
    needsStudios ? getMovieStudiosList().catch(() => []) : Promise.resolve([]),
  ])
  const genres = needsGenres ? allGenresRaw : []

  const ctx = { providers, studios }
  const description = getMoviesDiscoverDescription(state, genres, ctx)
  const title = getMoviesDiscoverTitle(state, genres, ctx)
  const path = getMoviesDiscoverCanonicalPath(state, genres, ctx)
  const keywords = getMoviesDiscoverKeywords(state, genres)

  if (keys.length > 1) {
    return {
      title,
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: path },
      ...discoverSocialMeta(title, description, path),
    }
  }

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    ...discoverSocialMeta(title, description, path),
  }
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseMoviesDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
  const { input, mode, comingYear } = discoverStateToBrowseInput(state, 1)
  const fetchParams = discoverStateToFetchParams(state)
  const filterKey = discoverFetchKey(state)

  const MOSAIC_POSTER_CAP = 420

  const [genres, providers, studios, results, mosaicUrls] = await Promise.all([
    getMovieGenresList(),
    getWatchProvidersMovieList(),
    getMovieStudiosList(),
    discoverMoviesBrowse(input, mode, comingYear),
    getTopMovies2026MosaicPosterUrls(MOSAIC_POSTER_CAP),
  ])

  const initialItems = await enrichMovieShelfRuntime(
    results.results.map(mapTmdbMovieRowToShelfItem)
  )
  const moviesCopyCtx = { providers, studios }
  const heroDescription = getMoviesDiscoverHeroLead(state, genres, moviesCopyCtx)
  const collectionLd =
    keys.length > 1
      ? null
      : buildCollectionPageJsonLd({
          name: getMoviesDiscoverTitle(state, genres, moviesCopyCtx),
          description: getMoviesDiscoverDescription(state, genres, moviesCopyCtx),
          pathname: getMoviesDiscoverCanonicalPath(state, genres, moviesCopyCtx),
        })
  const trustUpdatedAtLabel = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })

  return (
    <>
      {collectionLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
        />
      )}
      <div className={styles.page}>
        <MosaicHeroLcpPreload href={mosaicUrls[0]} />
        <MoviesDiscoverPage
          discoverState={state}
          genres={genres}
          providers={providers}
          studios={studios}
          fetchParams={fetchParams}
          filterKey={filterKey}
          basePath="/movies"
          apiPath="/api/discover"
          pageTitle="Movies"
          emptyText="No movies match these filters yet."
          contentLabelPlural="movies"
          presetsStorageKey="megdb-movies-filter-presets-v1"
          initialItems={initialItems}
          totalPages={results.total_pages}
          mosaicUrls={mosaicUrls}
          heroDescription={heroDescription}
          enableDiscoverPolish
          trustUpdatedAtLabel={trustUpdatedAtLabel}
        />
      </div>
    </>
  )
}

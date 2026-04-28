import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getMoviesDiscoverCanonicalPath,
  getMoviesDiscoverDescription,
  getMoviesDiscoverHeroLead,
  getMoviesDiscoverKeywords,
  getMoviesDiscoverTitle,
} from '@/lib/moviesDiscoverCopy'
import { buildCollectionPageStructuredData } from '@/lib/jsonLdSite'
import { buildDiscoverHubSnippetTemplate } from '@/lib/seoSnippetTemplates'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
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
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_DISCOVER_HUB` in `@/lib/cachePolicy` */
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
  const isHubRoot = keys.length === 0
  const hubSnippet = isHubRoot
    ? buildDiscoverHubSnippetTemplate({ page: 'movies', year: new Date().getFullYear() })
    : null
  const finalTitle = hubSnippet?.title ?? title
  const finalDescription = hubSnippet?.description ?? description

  if (keys.length > 1) {
    return {
      title: finalTitle,
      description: finalDescription,
      robots: { index: false, follow: true },
      alternates: discoverPageAlternates(path),
      ...discoverSocialMeta(finalTitle, finalDescription, path),
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    ...(keywords ? { keywords } : {}),
    alternates: discoverPageAlternates(path),
    ...discoverSocialMeta(finalTitle, finalDescription, path),
    ...(hubSnippet
      ? {
          other: {
            'megdb:snippet-cohort': hubSnippet.cohort,
          },
        }
      : {}),
  }
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseMoviesDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  if (genreOnly && state.genre) {
    const genrePath = movieGenrePathById(state.genre)
    if (genrePath) {
      redirect(genrePath)
    }
  }
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
  const hubStructured =
    keys.length > 1
      ? null
      : buildCollectionPageStructuredData({
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
      {hubStructured && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(hubStructured.collectionPage) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(hubStructured.breadcrumb) }}
          />
        </>
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
          seoTitle="Best Movies to Watch Online"
          seoSubtitle="Find top-rated and trending movies in one place. Browse by genre, release year, rating, runtime, language, streaming platform, and studio to quickly pick what to watch tonight."
          emptyText="No movies match these filters yet."
          contentLabelPlural="movies"
          presetsStorageKey="megdb-movies-filter-presets-v1"
          initialItems={initialItems}
          totalPages={results.total_pages}
          mosaicUrls={mosaicUrls}
          heroDescription={heroDescription}
          enableDiscoverPolish
          mobileGridColumns={3}
          trustUpdatedAtLabel={trustUpdatedAtLabel}
        />
      </div>
    </>
  )
}

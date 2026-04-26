import type { Metadata } from 'next'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getTvShowsDiscoverCanonicalPath,
  getTvShowsDiscoverDescription,
  getTvShowsDiscoverHeroLead,
  getTvShowsDiscoverKeywords,
  getTvShowsDiscoverTitle,
} from '@/lib/tvShowsDiscoverCopy'
import { buildCollectionPageJsonLd } from '@/lib/jsonLdSite'
import { discoverSocialMeta } from '@/lib/seoSocial'
import {
  discoverTvShowsBrowse,
  discoverTvShowsFetchKey,
  discoverTvShowsStateToBrowseInput,
  discoverTvShowsStateToFetchParams,
  enrichTvShowsShelfRuntime,
  getTopTvShows2026MosaicPosterUrls,
  getTvGenresList,
  getWatchProvidersTvList,
  getSeriesStudiosList,
  mapTmdbTvShowRowToShelfItem,
  moviesDiscoverActiveFilterKeys,
  parseTvShowsDiscoverSearchParams,
} from '@/lib/tmdb'
import styles from './page.module.css'

export const revalidate = 600

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const state = parseTvShowsDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  const needsGenres = genreOnly || (state.genre != null && keys.length > 1)
  const needsProviders = keys.includes('provider')
  const needsStudios = keys.includes('studio')

  const tvShowOnlyGenreIds = new Set(['10764', '10767', '10763', '10766'])
  const [allGenresRaw, providers, studios] = await Promise.all([
    needsGenres ? getTvGenresList().catch(() => []) : Promise.resolve([]),
    needsProviders ? getWatchProvidersTvList().catch(() => []) : Promise.resolve([]),
    needsStudios ? getSeriesStudiosList().catch(() => []) : Promise.resolve([]),
  ])
  const genres = needsGenres
    ? allGenresRaw.filter((g) => tvShowOnlyGenreIds.has(String(g.id)))
    : []

  const ctx = { providers, studios }
  const description = getTvShowsDiscoverDescription(state, genres, ctx)
  const title = getTvShowsDiscoverTitle(state, genres, ctx)
  const path = getTvShowsDiscoverCanonicalPath(state, genres, ctx)
  const keywords = getTvShowsDiscoverKeywords(state, genres)

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

export default async function TvShowsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseTvShowsDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
  const { input, mode, comingYear } = discoverTvShowsStateToBrowseInput(state, 1)
  const fetchParams = discoverTvShowsStateToFetchParams(state)
  const filterKey = discoverTvShowsFetchKey(state)
  const MOSAIC_POSTER_CAP = 420

  const [allGenres, providers, studios, results, mosaicUrls] = await Promise.all([
    getTvGenresList(),
    getWatchProvidersTvList(),
    getSeriesStudiosList(),
    discoverTvShowsBrowse(input, mode, comingYear),
    getTopTvShows2026MosaicPosterUrls(MOSAIC_POSTER_CAP),
  ])
  const tvShowOnlyGenreIdsPage = new Set(['10764', '10767', '10763', '10766'])
  const genres = allGenres.filter((g) => tvShowOnlyGenreIdsPage.has(String(g.id)))
  const tvShowsCopyCtx = { providers, studios }

  const initialItems = await enrichTvShowsShelfRuntime(
    results.results.map(mapTmdbTvShowRowToShelfItem)
  )
  const runtimeOptions = [
    { value: '', label: 'Any episode runtime' },
    { value: '0-25', label: 'Under 25 min' },
    { value: '25-45', label: '25–45 min' },
    { value: '45-60', label: '45–60 min' },
    { value: '60-999', label: '60+ min' },
  ]
  const presetSuggestions = [
    {
      name: 'Top 2026 hype',
      pinned: true,
      draft: {
        genre: '',
        year: '2026',
        sort: 'trending',
        provider: '',
        studio: '',
        rating: '',
        language: '',
        country: '',
        runtime: '',
        coming: '',
        expected: '',
      },
    },
    {
      name: 'Top-rated long-form',
      draft: {
        genre: '',
        year: '',
        sort: 'top',
        provider: '',
        studio: '',
        rating: '7',
        language: '',
        country: '',
        runtime: '45-60',
        coming: '',
        expected: '',
      },
    },
  ]
  const heroDescription = getTvShowsDiscoverHeroLead(state, genres, tvShowsCopyCtx)
  const collectionLd =
    keys.length > 1
      ? null
      : buildCollectionPageJsonLd({
          name: getTvShowsDiscoverTitle(state, genres, tvShowsCopyCtx),
          description: getTvShowsDiscoverDescription(state, genres, tvShowsCopyCtx),
          pathname: getTvShowsDiscoverCanonicalPath(state, genres, tvShowsCopyCtx),
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
          basePath="/tvshows"
          apiPath="/api/tvshows-discover"
          pageTitle="TV Shows"
          emptyText="No TV shows match these filters yet."
          contentLabelPlural="tv shows"
          presetsStorageKey="megdb-tvshows-filter-presets-v1"
          runtimeFilterLabel="Episode runtime"
          runtimeOptions={runtimeOptions}
          presetSuggestions={presetSuggestions}
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

import type { Metadata } from 'next'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import { buildCollectionPageJsonLd } from '@/lib/jsonLdSite'
import {
  getSeriesDiscoverCanonicalPath,
  getSeriesDiscoverDescription,
  getSeriesDiscoverHeroLead,
  getSeriesDiscoverKeywords,
  getSeriesDiscoverTitle,
} from '@/lib/seriesDiscoverCopy'
import { discoverSocialMeta } from '@/lib/seoSocial'
import {
  discoverSeriesBrowse,
  discoverSeriesFetchKey,
  discoverSeriesStateToBrowseInput,
  discoverSeriesStateToFetchParams,
  enrichSeriesShelfRuntime,
  getSeriesStudiosList,
  getTopSeries2026MosaicPosterUrls,
  getTvGenresList,
  getWatchProvidersTvList,
  mapTmdbSeriesRowToShelfItem,
  parseSeriesDiscoverSearchParams,
  seriesDiscoverActiveFilterKeys,
} from '@/lib/tmdb'
import styles from './page.module.css'

export const revalidate = 600

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const state = parseSeriesDiscoverSearchParams(sp)
  const keys = seriesDiscoverActiveFilterKeys(state)
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
    ? allGenresRaw.filter((g) => !tvShowOnlyGenreIds.has(String(g.id)))
    : []

  const ctx = { providers, studios }
  const description = getSeriesDiscoverDescription(state, genres, ctx)
  const title = getSeriesDiscoverTitle(state, genres, ctx)
  const path = getSeriesDiscoverCanonicalPath(state, genres, ctx)
  const keywords = getSeriesDiscoverKeywords(state, genres)

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

export default async function SeriesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseSeriesDiscoverSearchParams(sp)
  const keys = seriesDiscoverActiveFilterKeys(state)
  const { input, mode, comingYear } = discoverSeriesStateToBrowseInput(state, 1)
  const fetchParams = discoverSeriesStateToFetchParams(state)
  const filterKey = discoverSeriesFetchKey(state)
  const MOSAIC_POSTER_CAP = 420

  const [allGenres, providers, studios, results, mosaicUrls] = await Promise.all([
    getTvGenresList(),
    getWatchProvidersTvList(),
    getSeriesStudiosList(),
    discoverSeriesBrowse(input, mode, comingYear),
    getTopSeries2026MosaicPosterUrls(MOSAIC_POSTER_CAP),
  ])
  const tvShowOnlyGenreIdsPage = new Set(['10764', '10767', '10763', '10766'])
  const genres = allGenres.filter((g) => !tvShowOnlyGenreIdsPage.has(String(g.id)))
  const seriesCopyCtx = { providers, studios }

  const initialItems = await enrichSeriesShelfRuntime(
    results.results.map(mapTmdbSeriesRowToShelfItem)
  )
  const seriesRuntimeOptions = [
    { value: '', label: 'Any episode runtime' },
    { value: '0-25', label: 'Under 25 min' },
    { value: '25-45', label: '25–45 min' },
    { value: '45-60', label: '45–60 min' },
    { value: '60-999', label: '60+ min' },
  ]
  const seriesPresetSuggestions = [
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
      name: 'High-rated drama',
      draft: {
        genre: '18',
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
    {
      name: 'Crime weekly picks',
      draft: {
        genre: '80',
        year: '',
        sort: 'trending',
        provider: '',
        studio: '',
        rating: '',
        language: '',
        country: '',
        runtime: '45-60',
        coming: '',
        expected: '',
      },
    },
  ]
  const trustUpdatedAtLabel = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })

  const collectionLd =
    keys.length > 1
      ? null
      : buildCollectionPageJsonLd({
          name: getSeriesDiscoverTitle(state, genres, seriesCopyCtx),
          description: getSeriesDiscoverDescription(state, genres, seriesCopyCtx),
          pathname: getSeriesDiscoverCanonicalPath(state, genres, seriesCopyCtx),
        })
  const heroDescription = getSeriesDiscoverHeroLead(state, genres, seriesCopyCtx)

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
          basePath="/series"
          apiPath="/api/series-discover"
          pageTitle="Series"
          emptyText="No series match these filters yet."
          contentLabelPlural="series"
          presetsStorageKey="megdb-series-filter-presets-v1"
          runtimeFilterLabel="Episode runtime"
          runtimeOptions={seriesRuntimeOptions}
          presetSuggestions={seriesPresetSuggestions}
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

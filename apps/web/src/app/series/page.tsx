import type { Metadata } from 'next'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
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
} from '@/lib/tmdb'
import styles from './page.module.css'

export const revalidate = 600

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const state = parseSeriesDiscoverSearchParams(sp)
  const y = new Date().getFullYear()
  const suffix = state.sortParam === 'trending' ? 'Trending' : 'TV Series'
  return {
    title: `Best ${suffix} to Watch (${y})`,
    description:
      'Discover TV series with hype-first ranking, advanced filters, and streaming availability.',
    alternates: { canonical: '/series' },
  }
}

export default async function SeriesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseSeriesDiscoverSearchParams(sp)
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
  const tvShowOnlyGenreIds = new Set(['10764', '10767', '10763', '10766'])
  const genres = allGenres.filter((g) => !tvShowOnlyGenreIds.has(String(g.id)))

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

  return (
    <div className={styles.page}>
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
        heroDescription="Browse hype-ranked series. Starts from 2026, then 2025 and older, with advanced filters."
        enableDiscoverPolish
        trustUpdatedAtLabel={trustUpdatedAtLabel}
      />
    </div>
  )
}

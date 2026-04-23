import type { Metadata } from 'next'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getTvShowsDiscoverDescription,
  getTvShowsDiscoverHeroLead,
} from '@/lib/tvShowsDiscoverCopy'
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
  const tvShowOnlyGenreIds = new Set(['10764', '10767', '10763', '10766'])
  const genres = genreOnly
    ? (await getTvGenresList().catch(() => [])).filter((g) => tvShowOnlyGenreIds.has(String(g.id)))
    : []
  const description = getTvShowsDiscoverDescription(state, genres)
  const y = new Date().getFullYear()

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return {
        title: `Best ${g.name} TV Shows ${y}`,
        description,
        alternates: { canonical: `/tvshows?genre=${state.genre}` },
      }
    }
  }
  if (keys.length > 1) {
    return {
      title: 'Browse TV shows',
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: '/tvshows' },
    }
  }
  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return {
      title: `TV Shows from ${state.year}`,
      description,
      alternates: { canonical: `/tvshows?year=${state.year}` },
    }
  }
  return {
    title: `Best TV Shows to Watch (${y})`,
    description,
    keywords: [
      `best tv shows ${y}`,
      'tv shows to watch online',
      'top tv series streaming',
      `trending tv shows ${y}`,
      'where to watch tv shows',
      'tv runtime filters',
    ],
    alternates: { canonical: '/tvshows' },
  }
}

export default async function TvShowsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseTvShowsDiscoverSearchParams(sp)
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
  const tvShowOnlyGenreIds = new Set(['10764', '10767', '10763', '10766'])
  const genres = allGenres.filter((g) => tvShowOnlyGenreIds.has(String(g.id)))

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
  const heroDescription = getTvShowsDiscoverHeroLead(state, genres)
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
  )
}

import type { Metadata } from 'next'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getCartoonsDiscoverDescription,
  getCartoonsDiscoverHeroLead,
} from '@/lib/cartoonsDiscoverCopy'
import {
  discoverCartoonsBrowse,
  discoverCartoonsFetchKey,
  discoverCartoonsStateToBrowseInput,
  discoverCartoonsStateToFetchParams,
  enrichMovieShelfRuntime,
  getMovieGenresList,
  getMovieStudiosList,
  getTopCartoons2026MosaicPosterUrls,
  getWatchProvidersMovieList,
  mapTmdbCartoonRowToShelfItem,
  moviesDiscoverActiveFilterKeys,
  parseCartoonsDiscoverSearchParams,
} from '@/lib/tmdb'
import styles from './page.module.css'

export const revalidate = 600

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const state = parseCartoonsDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  const genres = genreOnly ? await getMovieGenresList().catch(() => []) : []
  const description = getCartoonsDiscoverDescription(state, genres)
  const y = new Date().getFullYear()

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return {
        title: `Best ${g.name} Cartoons ${y}`,
        description,
        alternates: { canonical: `/cartoons?genre=${state.genre}` },
      }
    }
  }

  if (keys.length > 1) {
    return {
      title: 'Browse cartoons',
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: '/cartoons' },
    }
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return {
      title: `Cartoons from ${state.year}`,
      description,
      alternates: { canonical: `/cartoons?year=${state.year}` },
    }
  }

  return {
    title: `Best Cartoons and Animated Movies to Watch (${y})`,
    description,
    keywords: [
      `best cartoons ${y}`,
      'animated movies to watch online',
      'best animation streaming',
      `top animation ${y}`,
      'family animation picks',
      'where to watch cartoons',
    ],
    alternates: { canonical: '/cartoons' },
  }
}

export default async function CartoonsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseCartoonsDiscoverSearchParams(sp)
  const { input, mode, comingYear } = discoverCartoonsStateToBrowseInput(state, 1)
  const fetchParams = discoverCartoonsStateToFetchParams(state)
  const filterKey = discoverCartoonsFetchKey(state)
  const MOSAIC_POSTER_CAP = 420

  const [genres, providers, studios, results, mosaicUrls] = await Promise.all([
    getMovieGenresList(),
    getWatchProvidersMovieList(),
    getMovieStudiosList(),
    discoverCartoonsBrowse(input, mode, comingYear),
    getTopCartoons2026MosaicPosterUrls(MOSAIC_POSTER_CAP),
  ])

  const initialItems = await enrichMovieShelfRuntime(
    results.results.map(mapTmdbCartoonRowToShelfItem)
  )
  const heroDescription = getCartoonsDiscoverHeroLead(state, genres)
  const cartoonRuntimeOptions = [
    { value: '', label: 'Any runtime' },
    { value: '0-90', label: 'Under 90 min' },
    { value: '90-120', label: '90–120 min' },
    { value: '120-150', label: '120–150 min' },
    { value: '150-999', label: '150+ min' },
  ]
  const cartoonPresetSuggestions = [
    {
      name: 'Top 2026 animation',
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
      name: 'Family picks',
      draft: {
        genre: '10751',
        year: '',
        sort: 'popularity.desc',
        provider: '',
        studio: '',
        rating: '6',
        language: '',
        country: '',
        runtime: '90-120',
        coming: '',
        expected: '',
      },
    },
    {
      name: 'High-rated animation',
      draft: {
        genre: '',
        year: '',
        sort: 'top',
        provider: '',
        studio: '',
        rating: '7',
        language: '',
        country: '',
        runtime: '',
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
        basePath="/cartoons"
        apiPath="/api/cartoons-discover"
        pageTitle="Cartoons"
        emptyText="No cartoons match these filters yet."
        contentLabelPlural="cartoons"
        presetsStorageKey="megdb-cartoons-filter-presets-v1"
        runtimeFilterLabel="Runtime"
        runtimeOptions={cartoonRuntimeOptions}
        presetSuggestions={cartoonPresetSuggestions}
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

import type { Metadata } from 'next'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import { getMoviesDiscoverDescription, getMoviesDiscoverHeroLead } from '@/lib/moviesDiscoverCopy'
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
  const y = new Date().getFullYear()

  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  const genres = genreOnly ? await getMovieGenresList().catch(() => []) : []
  const description = getMoviesDiscoverDescription(state, genres)

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return {
        title: `Best ${g.name} Movies ${y}`,
        description,
        alternates: { canonical: `/movies?genre=${state.genre}` },
      }
    }
  }

  if (keys.length > 1) {
    return {
      title: 'Browse movies',
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: '/movies' },
    }
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return {
      title: `Movies from ${state.year}`,
      description,
      alternates: { canonical: `/movies?year=${state.year}` },
    }
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return {
      title: `Coming in ${state.comingYear}`,
      description,
      alternates: { canonical: `/movies?coming=${state.comingYear}` },
    }
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
      new Date(Date.UTC(state.expectedYear, state.expectedMonth - 1, 1))
    )
    const expectedQs = `${state.expectedYear}-${String(state.expectedMonth).padStart(2, '0')}`
    return {
      title: `Expected in ${monthTitle} ${state.expectedYear}`,
      description,
      alternates: { canonical: `/movies?expected=${expectedQs}` },
    }
  }

  return {
    title: `Where to Watch Movies Online — Netflix, Prime, Disney+ (${y})`,
    description,
    keywords: [
      `best movies ${y}`,
      'movies to watch online',
      'best movies to stream',
      `top movies ${y}`,
      `movies streaming ${y}`,
      'where to watch movies',
      `best films ${y}`,
    ],
    alternates: { canonical: '/movies' },
  }
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseMoviesDiscoverSearchParams(sp)
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
  const heroDescription = getMoviesDiscoverHeroLead(state, genres)
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
  )
}

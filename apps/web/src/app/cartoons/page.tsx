import type { Metadata } from 'next'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import {
  getCartoonsDiscoverCanonicalPath,
  getCartoonsDiscoverDescription,
  getCartoonsDiscoverHeroLead,
  getCartoonsDiscoverKeywords,
  getCartoonsDiscoverTitle,
} from '@/lib/cartoonsDiscoverCopy'
import { buildCollectionPageJsonLd } from '@/lib/jsonLdSite'
import { discoverSocialMeta } from '@/lib/seoSocial'
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
  const description = getCartoonsDiscoverDescription(state, genres, ctx)
  const title = getCartoonsDiscoverTitle(state, genres, ctx)
  const path = getCartoonsDiscoverCanonicalPath(state, genres, ctx)
  const keywords = getCartoonsDiscoverKeywords(state, genres)

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

export default async function CartoonsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const state = parseCartoonsDiscoverSearchParams(sp)
  const keys = moviesDiscoverActiveFilterKeys(state)
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
  const cartoonsCopyCtx = { providers, studios }
  const heroDescription = getCartoonsDiscoverHeroLead(state, genres, cartoonsCopyCtx)
  const collectionLd =
    keys.length > 1
      ? null
      : buildCollectionPageJsonLd({
          name: getCartoonsDiscoverTitle(state, genres, cartoonsCopyCtx),
          description: getCartoonsDiscoverDescription(state, genres, cartoonsCopyCtx),
          pathname: getCartoonsDiscoverCanonicalPath(state, genres, cartoonsCopyCtx),
        })
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
    </>
  )
}

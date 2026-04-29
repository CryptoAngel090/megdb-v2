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
import { buildCollectionPageStructuredData } from '@/lib/jsonLdSite'
import { buildDiscoverHubSnippetTemplate } from '@/lib/seoSnippetTemplates'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
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

/** @sync `ROUTE_REVALIDATE_DISCOVER_HUB` in `@/lib/cachePolicy` */
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
  const isHubRoot = keys.length === 0
  const hubSnippet = isHubRoot
    ? buildDiscoverHubSnippetTemplate({ page: 'cartoons', year: new Date().getFullYear() })
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

  const initialItemsBase = results.results.map(mapTmdbCartoonRowToShelfItem)
  const initialItems = await enrichMovieShelfRuntime(initialItemsBase)
  const cartoonsCopyCtx = { providers, studios }
  const heroDescription = getCartoonsDiscoverHeroLead(state, genres, cartoonsCopyCtx)
  const hubStructured =
    keys.length > 1
      ? null
      : buildCollectionPageStructuredData({
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
          basePath="/cartoons"
          apiPath="/api/cartoons-discover"
          pageTitle="Cartoons"
          seoTitle="Best Cartoons and Animated Movies Online"
          seoSubtitle="Browse trending and top-rated cartoons with filters by genre, release year, rating, runtime, language, country, streaming platform, and studio."
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
          mobileGridColumns={3}
          trustUpdatedAtLabel={trustUpdatedAtLabel}
        />
      </div>
    </>
  )
}

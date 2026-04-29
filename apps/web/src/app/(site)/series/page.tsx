import type { Metadata } from 'next'
import { MosaicHeroLcpPreload } from '@/components/MosaicHeroLcpPreload'
import { MoviesDiscoverPage } from '@/components/MoviesDiscoverPage/MoviesDiscoverPage'
import { buildCollectionPageStructuredData } from '@/lib/jsonLdSite'
import { buildDiscoverHubSnippetTemplate } from '@/lib/seoSnippetTemplates'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import {
  getSeriesDiscoverCanonicalPath,
  getSeriesDiscoverDescription,
  getSeriesDiscoverHeroLead,
  getSeriesDiscoverKeywords,
  getSeriesDiscoverTitle,
} from '@/lib/seriesDiscoverCopy'
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

/** @sync `ROUTE_REVALIDATE_DISCOVER_HUB` in `@/lib/cachePolicy` */
export const revalidate = 600

function ensureTwoSeriesGenres(genres: string[] | undefined): string[] {
  const normalized = (genres ?? [])
    .map((g) => String(g).trim())
    .filter(Boolean)
    .slice(0, 2)
  if (normalized.length === 0) return ['SERIES', 'TV']
  if (normalized.length === 1) return [normalized[0]!, 'SERIES']
  return normalized
}

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
  const isHubRoot = keys.length === 0
  const hubSnippet = isHubRoot
    ? buildDiscoverHubSnippetTemplate({ page: 'series', year: new Date().getFullYear() })
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

  const initialItemsBase = results.results.map(mapTmdbSeriesRowToShelfItem)
  const initialItemsWithRuntime = await enrichSeriesShelfRuntime(initialItemsBase)
  const initialItems = initialItemsWithRuntime.map((item) => ({
    ...item,
    genres: ensureTwoSeriesGenres(item.genres),
  }))
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

  const hubStructured =
    keys.length > 1
      ? null
      : buildCollectionPageStructuredData({
          name: getSeriesDiscoverTitle(state, genres, seriesCopyCtx),
          description: getSeriesDiscoverDescription(state, genres, seriesCopyCtx),
          pathname: getSeriesDiscoverCanonicalPath(state, genres, seriesCopyCtx),
        })
  const heroDescription = getSeriesDiscoverHeroLead(state, genres, seriesCopyCtx)

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
          basePath="/series"
          apiPath="/api/series-discover"
          pageTitle="Series"
          seoTitle="Best TV Series to Watch Online"
          seoSubtitle="Discover trending and top-rated TV series with smart filters by genre, release year, rating, episode runtime, language, country, streaming platform, and studio."
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
          mobileGridColumns={3}
          trustUpdatedAtLabel={trustUpdatedAtLabel}
        />
      </div>
    </>
  )
}

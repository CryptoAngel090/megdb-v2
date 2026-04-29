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
import { buildCollectionPageStructuredData } from '@/lib/jsonLdSite'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
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

/** @sync `ROUTE_REVALIDATE_DISCOVER_HUB` in `@/lib/cachePolicy` */
export const revalidate = 600

function isStrictTvShowRow(row: {
  name?: string | null
  first_air_date?: string | null
  title?: string | null
  release_date?: string | null
}): boolean {
  const hasTvSignals =
    typeof row.name === 'string' &&
    row.name.trim().length > 0 &&
    typeof row.first_air_date === 'string' &&
    row.first_air_date.trim().length > 0
  const hasMovieSignals =
    (typeof row.title === 'string' && row.title.trim().length > 0) ||
    (typeof row.release_date === 'string' && row.release_date.trim().length > 0)
  return hasTvSignals && !hasMovieSignals
}

function ensureTwoTvShowGenres(genres: string[] | undefined): string[] {
  const normalized = (genres ?? [])
    .map((g) => String(g).trim())
    .filter(Boolean)
    .slice(0, 2)
  if (normalized.length === 0) return ['TV SHOW', 'TV SHOW']
  if (normalized.length === 1) return [normalized[0]!, 'TV SHOW']
  return normalized
}

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
  const genres = needsGenres ? allGenresRaw.filter((g) => tvShowOnlyGenreIds.has(String(g.id))) : []

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
      alternates: discoverPageAlternates(path),
      ...discoverSocialMeta(title, description, path),
    }
  }

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: discoverPageAlternates(path),
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
    results.results.filter(isStrictTvShowRow).map(mapTmdbTvShowRowToShelfItem)
  )
  const normalizedInitialItems = initialItems.map((item) => ({
    ...item,
    genres: ensureTwoTvShowGenres(item.genres),
  }))
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
  const hubStructured =
    keys.length > 1
      ? null
      : buildCollectionPageStructuredData({
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
          basePath="/tvshows"
          apiPath="/api/tvshows-discover"
          pageTitle="TV Shows"
          seoTitle="Best TV Shows to Watch Online"
          seoSubtitle="Find trending and top-rated TV shows with smart filters by genre, release year, rating, episode runtime, language, country, streaming platform, and studio."
          emptyText="No TV shows match these filters yet."
          contentLabelPlural="tv shows"
          presetsStorageKey="megdb-tvshows-filter-presets-v1"
          runtimeFilterLabel="Episode runtime"
          runtimeOptions={runtimeOptions}
          presetSuggestions={presetSuggestions}
          initialItems={normalizedInitialItems}
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

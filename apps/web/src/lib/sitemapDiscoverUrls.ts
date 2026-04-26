import type { MetadataRoute } from 'next'
import type { HeroItem, ShelfItem } from '@/lib/tmdb'
import {
  discoverCartoonsBrowse,
  discoverCartoonsStateToBrowseInput,
  discoverSeriesBrowse,
  discoverSeriesStateToBrowseInput,
  discoverTvShowsBrowse,
  discoverTvShowsStateToBrowseInput,
  getAcclaimedRecentMovies,
  getBestMoviesAllTime,
  getBestOf2026,
  getBestSeriesAllTime,
  getHeroItems,
  getNewReleases,
  getTrendingNow,
  mapTmdbCartoonRowToShelfItem,
  mapTmdbSeriesRowToShelfItem,
  mapTmdbTvShowRowToShelfItem,
  parseCartoonsDiscoverSearchParams,
  parseSeriesDiscoverSearchParams,
  parseTvShowsDiscoverSearchParams,
} from '@/lib/tmdb'
import { SITE_URL } from '@/lib/site'
import { detailPathForMedia, moviePath } from '@/lib/slug'

const LIST_FALLBACK = new Set(['/movies', '/series', '/cartoons', '/tvshows'])

function isIndexableDetailPath(path: string): boolean {
  if (LIST_FALLBACK.has(path)) return false
  return /^\/(movie|series|cartoon|tvshow)\/[^/]+$/.test(path)
}

function lastModForShelfItem(item: ShelfItem): Date {
  return item.releaseDate ?? new Date()
}

function pathAndModForShelfItem(item: ShelfItem): { path: string; lastModified: Date } | null {
  const iso = item.releaseDate ? item.releaseDate.toISOString().slice(0, 10) : null
  const path = detailPathForMedia(item.type, item.title, iso)
  if (!isIndexableDetailPath(path)) return null
  return { path, lastModified: lastModForShelfItem(item) }
}

function pathAndModForHero(item: HeroItem): { path: string; lastModified: Date } | null {
  const iso = item.releaseDate.toISOString().slice(0, 10)
  const path = moviePath(item.title, iso)
  if (!isIndexableDetailPath(path)) return null
  return { path, lastModified: item.releaseDate }
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p
  } catch {
    return fallback
  }
}

type DiscoverPageResult = Awaited<ReturnType<typeof discoverCartoonsBrowse>>

/** Empty TMDB page when a discover call fails (keeps `safe()` typings strict). */
const EMPTY_DISCOVER_PAGE: DiscoverPageResult = {
  results: [],
  page: 1,
  total_pages: 0,
  total_results: 0,
}

/**
 * Canonical detail URLs derived from the same TMDB surfaces as the homepage rails,
 * plus first-page /cartoons and /tvshows discover feeds. Person pages are omitted while
 * the template remains a thin placeholder.
 */
export async function fetchDiscoverUrlsForSitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.TMDB_API_KEY?.trim()) {
    return []
  }

  const cartoonsPayload = discoverCartoonsStateToBrowseInput(parseCartoonsDiscoverSearchParams({}), 1)
  const seriesPayload = discoverSeriesStateToBrowseInput(parseSeriesDiscoverSearchParams({}), 1)
  const tvShowsPayload = discoverTvShowsStateToBrowseInput(parseTvShowsDiscoverSearchParams({}), 1)

  const [
    hero,
    best2026,
    trending,
    newReleases,
    acclaimed,
    bestMovies,
    bestSeries,
    cartoonPage,
    seriesDiscoverPage,
    tvShowsPage,
  ] = await Promise.all([
    safe(getHeroItems(), [] as HeroItem[]),
    safe(getBestOf2026(), [] as ShelfItem[]),
    safe(getTrendingNow(), [] as ShelfItem[]),
    safe(getNewReleases(), [] as ShelfItem[]),
    safe(getAcclaimedRecentMovies(40), [] as ShelfItem[]),
    safe(getBestMoviesAllTime(), [] as ShelfItem[]),
    safe(getBestSeriesAllTime(), [] as ShelfItem[]),
    safe(
      discoverCartoonsBrowse(cartoonsPayload.input, cartoonsPayload.mode, cartoonsPayload.comingYear),
      EMPTY_DISCOVER_PAGE,
    ),
    safe(
      discoverSeriesBrowse(seriesPayload.input, seriesPayload.mode, seriesPayload.comingYear),
      EMPTY_DISCOVER_PAGE,
    ),
    safe(
      discoverTvShowsBrowse(tvShowsPayload.input, tvShowsPayload.mode, tvShowsPayload.comingYear),
      EMPTY_DISCOVER_PAGE,
    ),
  ])

  const byPath = new Map<string, Date>()

  const absorb = (path: string, lastModified: Date) => {
    const prev = byPath.get(path)
    if (!prev || lastModified > prev) byPath.set(path, lastModified)
  }

  for (const h of hero) {
    const row = pathAndModForHero(h)
    if (row) absorb(row.path, row.lastModified)
  }

  const shelfLists: ShelfItem[][] = [
    best2026,
    trending,
    newReleases,
    acclaimed,
    bestMovies,
    bestSeries,
    cartoonPage.results.slice(0, 40).map(mapTmdbCartoonRowToShelfItem),
    seriesDiscoverPage.results.slice(0, 40).map(mapTmdbSeriesRowToShelfItem),
    tvShowsPage.results.slice(0, 40).map(mapTmdbTvShowRowToShelfItem),
  ]

  for (const list of shelfLists) {
    for (const item of list) {
      const row = pathAndModForShelfItem(item)
      if (row) absorb(row.path, row.lastModified)
    }
  }

  const out: MetadataRoute.Sitemap = []
  for (const [path, lastModified] of byPath) {
    out.push({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.65,
    })
  }

  out.sort((a, b) => a.url.localeCompare(b.url))
  return out
}

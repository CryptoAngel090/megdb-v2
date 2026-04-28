import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'
import {
  discoverTvShowsBrowse,
  discoverTvShowsStateToBrowseInput,
  enrichTvShowsShelfRuntime,
  mapTmdbTvShowRowToShelfItem,
  parseTvShowsDiscoverSearchParams,
} from '@/lib/tmdb'

const DISCOVER_RATE_LIMIT = 60

function isStrictTvShowRow(row: {
  name?: string | null
  first_air_date?: string | null
  title?: string | null
  release_date?: string | null
}): boolean {
  const hasTvSignals =
    (typeof row.name === 'string' && row.name.trim().length > 0) &&
    (typeof row.first_air_date === 'string' && row.first_air_date.trim().length > 0)
  const hasMovieSignals =
    (typeof row.title === 'string' && row.title.trim().length > 0) ||
    (typeof row.release_date === 'string' && row.release_date.trim().length > 0)
  return hasTvSignals && !hasMovieSignals
}

function ensureTwoTvShowGenres(genres: string[] | undefined): string[] {
  const normalized = (genres ?? []).map((g) => String(g).trim()).filter(Boolean).slice(0, 2)
  if (normalized.length === 0) return ['TV SHOW', 'TV SHOW']
  if (normalized.length === 1) return [normalized[0]!, 'TV SHOW']
  return normalized
}

function urlSearchParamsToDiscoverRecord(
  sp: URLSearchParams
): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {}
  for (const key of [
    'genre',
    'year',
    'sort',
    'provider',
    'studio',
    'rating',
    'language',
    'country',
    'runtime',
    'coming',
  ]) {
    const v = sp.get(key)
    if (v != null && v !== '') out[key] = v
  }
  return out
}

function clampDiscoverPage(raw: string | null): number {
  if (raw == null || raw === '') return 1
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return 1
  return Math.min(500, Math.max(1, n))
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request)
  const limited = checkRateLimit(`tvshows-discover:${ip}`, DISCOVER_RATE_LIMIT)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: limited.retryAfterSec },
      {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSec ?? 60) },
      }
    )
  }

  const sp = request.nextUrl.searchParams
  const page = clampDiscoverPage(sp.get('page'))
  const state = parseTvShowsDiscoverSearchParams(urlSearchParamsToDiscoverRecord(sp))
  const { input, mode, comingYear } = discoverTvShowsStateToBrowseInput(state, page)

  try {
    const data = await discoverTvShowsBrowse(input, mode, comingYear)
    const strictTvRows = data.results.filter(isStrictTvShowRow)
    const withRuntime = await enrichTvShowsShelfRuntime(strictTvRows.map(mapTmdbTvShowRowToShelfItem))
    const results = withRuntime.map((item) => ({
      ...item,
      genres: ensureTwoTvShowGenres(item.genres),
    }))
    return NextResponse.json(
      {
        results,
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Discover failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

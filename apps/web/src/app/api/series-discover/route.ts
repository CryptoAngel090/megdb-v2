import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'
import {
  discoverSeriesBrowse,
  discoverSeriesStateToBrowseInput,
  enrichSeriesShelfRuntime,
  mapTmdbSeriesRowToShelfItem,
  parseSeriesDiscoverSearchParams,
} from '@/lib/tmdb'

const DISCOVER_RATE_LIMIT = 60

function ensureTwoSeriesGenres(genres: string[] | undefined): string[] {
  const normalized = (genres ?? []).map((g) => String(g).trim()).filter(Boolean).slice(0, 2)
  if (normalized.length === 0) return ['SERIES', 'TV']
  if (normalized.length === 1) return [normalized[0]!, 'SERIES']
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
  const limited = checkRateLimit(`series-discover:${ip}`, DISCOVER_RATE_LIMIT)
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
  const state = parseSeriesDiscoverSearchParams(urlSearchParamsToDiscoverRecord(sp))
  const { input, mode, comingYear } = discoverSeriesStateToBrowseInput(state, page)

  try {
    const data = await discoverSeriesBrowse(input, mode, comingYear)
    const baseResults = data.results.map(mapTmdbSeriesRowToShelfItem)
    const withRuntime = await enrichSeriesShelfRuntime(baseResults)
    const results = withRuntime.map((item) => ({
      ...item,
      genres: ensureTwoSeriesGenres(item.genres),
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

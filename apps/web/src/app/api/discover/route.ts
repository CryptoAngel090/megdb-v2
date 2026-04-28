import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'
import {
  discoverMoviesBrowse,
  discoverStateToBrowseInput,
  enrichMovieShelfRuntime,
  mapTmdbMovieRowToShelfItem,
  parseMoviesDiscoverSearchParams,
} from '@/lib/tmdb'

const DISCOVER_RATE_LIMIT = 60

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
    'expected',
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
  const limited = checkRateLimit(`discover:${ip}`, DISCOVER_RATE_LIMIT)
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
  const state = parseMoviesDiscoverSearchParams(urlSearchParamsToDiscoverRecord(sp))
  const { input, mode, comingYear } = discoverStateToBrowseInput(state, page)

  try {
    const data = await discoverMoviesBrowse(input, mode, comingYear)
    const results = await enrichMovieShelfRuntime(data.results.map(mapTmdbMovieRowToShelfItem))
    return NextResponse.json(
      {
        results,
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
      },
      {
        headers: {
          // Cache on Vercel CDN: fresh 10m, serve stale up to 30m while revalidating.
          // Keyed by full URL (query params included) — different filters = different cache entries.
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Discover failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'
import {
  discoverCartoonsBrowse,
  discoverCartoonsStateToBrowseInput,
  enrichMovieShelfRuntime,
  mapTmdbCartoonRowToShelfItem,
  parseCartoonsDiscoverSearchParams,
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
  const limited = checkRateLimit(`cartoons-discover:${ip}`, DISCOVER_RATE_LIMIT)
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
  const state = parseCartoonsDiscoverSearchParams(urlSearchParamsToDiscoverRecord(sp))
  const { input, mode, comingYear } = discoverCartoonsStateToBrowseInput(state, page)

  try {
    const data = await discoverCartoonsBrowse(input, mode, comingYear)
    const results = await enrichMovieShelfRuntime(data.results.map(mapTmdbCartoonRowToShelfItem))
    return NextResponse.json({
      results,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Discover failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

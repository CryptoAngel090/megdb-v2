import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY ?? ''

/** Per-IP search requests per rolling minute (in-memory; use Redis in multi-instance prod). */
const SEARCH_RATE_LIMIT = 45

interface TmdbSearchResult {
  id: number
  media_type?: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  poster_path?: string | null
  profile_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  first_air_date?: string
  known_for_department?: string
  popularity?: number
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[]
  total_pages?: number
}

function isTmdbSearchResponse(value: unknown): value is TmdbSearchResponse {
  if (!value || typeof value !== 'object' || !('results' in value)) {
    return false
  }

  const data = value as { results: unknown }
  return Array.isArray(data.results)
}

function popularityOf(item: TmdbSearchResult): number {
  const p = item.popularity
  return typeof p === 'number' && Number.isFinite(p) ? p : 0
}

/** Release or first-air date as epoch ms, or null if missing / invalid. */
function primaryReleaseMs(item: TmdbSearchResult): number | null {
  const raw = item.release_date || item.first_air_date
  if (!raw) return null
  const ms = Date.parse(raw)
  return Number.isNaN(ms) ? null : ms
}

/**
 * Newest titles first (by full date), then undated titles by popularity; people last (by popularity).
 */
function compareSearchResults(a: TmdbSearchResult, b: TmdbSearchResult): number {
  const aPerson = a.media_type === 'person'
  const bPerson = b.media_type === 'person'
  if (aPerson !== bPerson) {
    return aPerson ? 1 : -1
  }
  if (aPerson && bPerson) {
    return popularityOf(b) - popularityOf(a)
  }

  const ad = primaryReleaseMs(a)
  const bd = primaryReleaseMs(b)
  if (ad !== null && bd !== null) {
    if (bd !== ad) return bd - ad
    return popularityOf(b) - popularityOf(a)
  }
  if (ad !== null && bd === null) return -1
  if (ad === null && bd !== null) return 1
  return popularityOf(b) - popularityOf(a)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const ip = getRequestIp(request)
  const limited = checkRateLimit(`search:${ip}`, SEARCH_RATE_LIMIT)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: limited.retryAfterSec },
      {
        status: 429,
        headers: {
          'Retry-After': String(limited.retryAfterSec ?? 60),
        },
      }
    )
  }

  try {
    const pagesToFetch = query.trim().length <= 3 ? 3 : 1
    const pageJobs: Array<Promise<TmdbSearchResponse>> = []

    for (let page = 1; page <= pagesToFetch; page += 1) {
      const url = new URL(`${TMDB_BASE}/search/multi`)
      url.searchParams.set('api_key', API_KEY)
      url.searchParams.set('query', query)
      url.searchParams.set('language', 'en-US')
      url.searchParams.set('page', String(page))
      pageJobs.push(
        fetch(url.toString()).then(async (response) => {
          if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`)
          }
          const rawData: unknown = await response.json()
          if (!isTmdbSearchResponse(rawData)) {
            throw new Error('Invalid TMDB response shape')
          }
          return rawData
        })
      )
    }

    const pages = await Promise.all(pageJobs)
    const mergedResults = pages.flatMap((p) => p.results ?? [])
    const seen = new Set<string>()
    const uniqueResults = mergedResults.filter((item) => {
      const key = `${item.media_type ?? 'unknown'}:${item.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const filtered = uniqueResults.filter(
      (item) =>
        item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person'
    )
    filtered.sort(compareSearchResults)

    // rule 43: normalize rows (order: newest releases first, then people)
    const results = filtered.map((item) => {
      const type = item.media_type === 'tv' ? 'series' : item.media_type
      const title = item.title || item.name || 'Untitled'
      const posterPath = item.poster_path || item.profile_path || item.backdrop_path || null

      let year: string | undefined
      if (item.release_date) {
        year = new Date(item.release_date).getFullYear().toString()
      } else if (item.first_air_date) {
        year = new Date(item.first_air_date).getFullYear().toString()
      }

      let subtitle: string | undefined
      if (item.media_type === 'person' && item.known_for_department) {
        subtitle = item.known_for_department
      }

      return {
        id: item.id,
        type,
        title,
        subtitle,
        posterPath,
        year,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

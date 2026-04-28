import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import {
  CACHE_TAG_TRENDING,
  CACHE_TAG_HOME_MODERATE,
  CACHE_TAG_ALL_TIME,
  CACHE_TAG_PEOPLE,
  CACHE_TAG_DISCOVER_MOVIES,
  CACHE_TAG_DISCOVER_TV,
  cacheTagMovie,
  cacheTagTv,
  cacheTagPerson,
} from '@/lib/cachePolicy'

/**
 * On-demand ISR revalidation endpoint.
 *
 * Usage:
 *   POST /api/revalidate?secret=<REVALIDATE_SECRET>&tag=tmdb-trending
 *   POST /api/revalidate?secret=<REVALIDATE_SECRET>&tag=tmdb-movie-550
 *
 * Valid tags:
 *   tmdb-trending          — hero, trending, new releases
 *   tmdb-home-moderate     — best-of-year, acclaimed
 *   tmdb-all-time          — top-rated all-time lists
 *   tmdb-people            — popular actors
 *   tmdb-discover-movies   — movies discover hub
 *   tmdb-discover-tv       — TV discover hub
 *   tmdb-movie-{id}        — single movie detail
 *   tmdb-tv-{id}           — single TV detail
 *   tmdb-person-{id}       — single person detail
 *
 * Set REVALIDATE_SECRET in environment variables.
 * Never expose this secret in client-side code.
 */

const VALID_COARSE_TAGS = new Set([
  CACHE_TAG_TRENDING,
  CACHE_TAG_HOME_MODERATE,
  CACHE_TAG_ALL_TIME,
  CACHE_TAG_PEOPLE,
  CACHE_TAG_DISCOVER_MOVIES,
  CACHE_TAG_DISCOVER_TV,
])

function resolveTag(raw: string): string | null {
  // Coarse tags — exact match
  if (VALID_COARSE_TAGS.has(raw)) return raw

  // Fine-grained: tmdb-movie-{id}, tmdb-tv-{id}, tmdb-person-{id}
  const movieMatch = /^tmdb-movie-(\d+)$/.exec(raw)
  if (movieMatch) return cacheTagMovie(Number(movieMatch[1]))

  const tvMatch = /^tmdb-tv-(\d+)$/.exec(raw)
  if (tvMatch) return cacheTagTv(Number(tvMatch[1]))

  const personMatch = /^tmdb-person-(\d+)$/.exec(raw)
  if (personMatch) return cacheTagPerson(Number(personMatch[1]))

  return null
}

export function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.REVALIDATE_SECRET

  if (!expectedSecret) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET is not configured' }, { status: 500 })
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const tagParam = request.nextUrl.searchParams.get('tag')
  if (!tagParam) {
    return NextResponse.json(
      {
        error: 'Missing tag parameter',
        validTags: [...VALID_COARSE_TAGS, 'tmdb-movie-{id}', 'tmdb-tv-{id}', 'tmdb-person-{id}'],
      },
      { status: 400 }
    )
  }

  const tag = resolveTag(tagParam)
  if (!tag) {
    return NextResponse.json(
      {
        error: `Unknown tag: ${tagParam}`,
        validTags: [...VALID_COARSE_TAGS, 'tmdb-movie-{id}', 'tmdb-tv-{id}', 'tmdb-person-{id}'],
      },
      { status: 400 }
    )
  }

  revalidateTag(tag, 'max')

  return NextResponse.json({
    revalidated: true,
    tag,
    timestamp: new Date().toISOString(),
  })
}

// Block GET to prevent accidental cache busting via browser navigation
export function GET() {
  return NextResponse.json({ error: 'Use POST' }, { status: 405 })
}

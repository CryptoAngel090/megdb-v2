import { NextRequest, NextResponse } from 'next/server'
import { FETCH_REVALIDATE_RANDOM_MOVIE } from '@/lib/cachePolicy'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY ?? ''
const RATE_LIMIT = 30

// Genre ids to exclude (animation, documentary, music, news, reality, talk, soap)
const EXCLUDE_GENRES = '16,99,10402,10763,10764,10766,10767'

interface TmdbDiscoverResult {
  id: number
  title?: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  release_date?: string
  genre_ids?: number[]
  popularity: number
}

interface TmdbDiscoverPage {
  results: TmdbDiscoverResult[]
  total_pages: number
  page: number
}

interface TmdbMovieDetail {
  runtime?: number | null
  genres?: { id: number; name: string }[]
}

const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  35: 'Comedy',
  80: 'Crime',
  18: 'Drama',
  14: 'Fantasy',
  27: 'Horror',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  37: 'Western',
  36: 'History',
  10751: 'Family',
  10752: 'War',
  10770: 'TV Movie',
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { next: { revalidate: FETCH_REVALIDATE_RANDOM_MOVIE } })
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json() as Promise<T>
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request)
  const limited = checkRateLimit(`random-movie:${ip}`, RATE_LIMIT)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: limited.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec ?? 60) } }
    )
  }

  const sp = request.nextUrl.searchParams
  const genre = sp.get('genre') ?? ''
  const year = sp.get('year') ?? ''
  const decade = sp.get('decade') ?? ''
  const minRating = sp.get('minRating') ?? ''

  // Build discover params
  const params: Record<string, string> = {
    sort_by: 'popularity.desc',
    without_genres: EXCLUDE_GENRES,
    'vote_count.gte': '50',
    include_adult: 'false',
  }

  if (genre) params['with_genres'] = genre
  if (minRating) params['vote_average.gte'] = minRating

  if (year) {
    params['primary_release_year'] = year
  } else if (decade) {
    const start = Number(decade)
    if (Number.isFinite(start)) {
      params['primary_release_date.gte'] = `${start}-01-01`
      params['primary_release_date.lte'] = `${start + 9}-12-31`
    }
  }

  try {
    // First fetch page 1 to know total_pages
    const first = await tmdbFetch<TmdbDiscoverPage>('/discover/movie', { ...params, page: '1' })

    if (!first.results.length) {
      return NextResponse.json({ error: 'No movies found for these filters' }, { status: 404 })
    }

    // Pick a random page (cap at 20 to avoid low-quality tail)
    const maxPage = Math.min(first.total_pages, 20)
    const randomPage = Math.floor(Math.random() * maxPage) + 1

    let pool: TmdbDiscoverResult[]
    if (randomPage === 1) {
      pool = first.results
    } else {
      const page = await tmdbFetch<TmdbDiscoverPage>('/discover/movie', {
        ...params,
        page: String(randomPage),
      })
      pool = page.results
    }

    if (!pool.length) {
      pool = first.results
    }

    // Pick random item from pool
    const item = pool[Math.floor(Math.random() * pool.length)]!

    // Fetch detail for runtime + genre names
    let runtime: number | null = null
    let genreNames: string[] = []

    try {
      const detail = await tmdbFetch<TmdbMovieDetail>(`/movie/${item.id}`, {})
      runtime = detail.runtime != null && detail.runtime > 0 ? detail.runtime : null
      genreNames = (detail.genres ?? []).map((g) => g.name).slice(0, 3)
    } catch {
      // Fallback to genre_ids
      genreNames = (item.genre_ids ?? [])
        .map((id) => GENRE_NAMES[id])
        .filter((n): n is string => Boolean(n))
        .slice(0, 3)
    }

    return NextResponse.json({
      id: item.id,
      title: item.title ?? 'Untitled',
      overview: item.overview ?? '',
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      releaseDate: item.release_date ?? null,
      runtime,
      genres: genreNames,
      popularity: item.popularity,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch random movie'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

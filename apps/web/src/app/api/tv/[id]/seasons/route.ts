import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

/** TMDB `GET /tv/{id}` → `seasons[]` row (snake_case from API). */
interface TmdbTvDetailSeason {
  id: number
  name?: string
  season_number: number
  episode_count?: number
  air_date?: string | null
  overview?: string | null
  poster_path?: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isTmdbTvDetailSeason(v: unknown): v is TmdbTvDetailSeason {
  if (!isRecord(v)) return false
  return typeof v['id'] === 'number' && typeof v['season_number'] === 'number'
}

function seasonsFromTvDetailJson(raw: unknown): TmdbTvDetailSeason[] {
  if (!isRecord(raw)) return []
  const list = raw['seasons']
  if (!Array.isArray(list)) return []
  return list.filter(isTmdbTvDetailSeason)
}

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch series data' },
        { status: response.status }
      )
    }

    const raw: unknown = await response.json()

    const seasons = seasonsFromTvDetailJson(raw)
      .filter((season) => season.season_number > 0) // Skip specials (season 0)
      .map((season) => ({
        id: season.id,
        name: season.name,
        seasonNumber: season.season_number,
        episodeCount: season.episode_count,
        airDate: season.air_date,
        overview: season.overview || '',
        posterPath: season.poster_path,
      }))

    return NextResponse.json({ seasons })
  } catch (error) {
    console.error('Error fetching seasons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

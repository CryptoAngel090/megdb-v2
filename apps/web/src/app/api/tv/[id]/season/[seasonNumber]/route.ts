import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

type Params = {
  params: Promise<{ id: string; seasonNumber: string }>
}

/**
 * GET /api/tv/:id/season/:seasonNumber — episode list for one season (TMDB `tv/{id}/season/{n}`).
 */
export async function GET(_request: Request, { params }: Params) {
  const { id, seasonNumber } = await params

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
  }

  const season = Number(seasonNumber)
  if (!Number.isFinite(season) || season < 0) {
    return NextResponse.json({ error: 'Invalid season number' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${encodeURIComponent(id)}/season/${season}?api_key=${TMDB_API_KEY}&language=en-US`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch season from TMDB' },
        { status: response.status }
      )
    }

    const data = (await response.json()) as {
      episodes?: Array<{
        id: number
        name: string
        overview: string | null
        episode_number: number
        season_number: number
        still_path: string | null
        air_date: string | null
        runtime: number | null
        vote_average: number
      }>
    }

    const episodes = (data.episodes ?? []).map((ep) => ({
      id: ep.id,
      name: ep.name,
      overview: ep.overview ?? '',
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number,
      stillPath: ep.still_path,
      airDate: ep.air_date,
      runtime: ep.runtime,
      voteAverage: ep.vote_average ?? 0,
    }))

    return NextResponse.json({ episodes })
  } catch (error) {
    console.error('Error fetching TV season episodes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

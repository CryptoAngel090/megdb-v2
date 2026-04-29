import { NextRequest, NextResponse } from 'next/server'
import { getMoviePageDataShell } from '@/lib/tmdb'

function parseIds(raw: string): number[] | null {
  const split = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (split.length > 100) return null
  const ids: number[] = []
  for (const item of split) {
    const id = Number(item)
    if (!Number.isInteger(id) || id <= 0) return null
    ids.push(id)
  }
  return ids
}

export async function GET(request: NextRequest) {
  const rawIds = request.nextUrl.searchParams.get('ids') ?? ''
  const parsedIds = parseIds(rawIds)
  if (parsedIds == null) {
    return NextResponse.json({ error: 'Invalid ids query parameter' }, { status: 400 })
  }

  const deduped = [...new Set(parsedIds)]
  if (deduped.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const resolved = await Promise.all(
    deduped.map(async (id) => {
      const movie = await getMoviePageDataShell(id)
      if (!movie) return null
      return {
        id: movie.id,
        title: movie.title,
        releaseDate: movie.releaseDate ?? null,
        posterPath: movie.posterPath,
        voteAverage: movie.voteAverage,
        runtimeMinutes: movie.runtime ?? null,
      }
    })
  )

  return NextResponse.json({ items: resolved.filter((item) => item != null) })
}

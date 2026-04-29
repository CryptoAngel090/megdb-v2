import type { MediaType } from '@repo/types'
import { NextRequest, NextResponse } from 'next/server'
import { detailPathForMedia } from '@/lib/slug'
import { getMoviePageDataShell, getTvPageDataShell } from '@/lib/tmdb'

interface WatchlistHydrationInput {
  mediaId: number
  mediaType: MediaType
  title: string
  releaseDate: string | null
  addedAt: string
  pinned: boolean
  manualOrder: number | null
}

interface WatchlistHydrationOutput extends WatchlistHydrationInput {
  posterPath: string | null
  voteAverage: number
  runtimeMinutes: number | null
  genres: string[]
  href: string
}

function isMediaType(value: unknown): value is MediaType {
  return value === 'movie' || value === 'series' || value === 'cartoon' || value === 'tvshow'
}

function parseBody(body: unknown): WatchlistHydrationInput[] | null {
  if (typeof body !== 'object' || body == null) return null
  const rows = (body as { items?: unknown }).items
  if (!Array.isArray(rows)) return null
  if (rows.length > 200) return null

  const parsed: WatchlistHydrationInput[] = []
  for (const row of rows) {
    if (typeof row !== 'object' || row == null) return null
    const item = row as Record<string, unknown>
    if (!Number.isInteger(item.mediaId) || Number(item.mediaId) <= 0) return null
    if (!isMediaType(item.mediaType)) return null
    if (typeof item.title !== 'string' || item.title.trim() === '') return null
    if (!(typeof item.releaseDate === 'string' || item.releaseDate == null)) return null
    if (typeof item.addedAt !== 'string' || item.addedAt.trim() === '') return null

    parsed.push({
      mediaId: Number(item.mediaId),
      mediaType: item.mediaType,
      title: item.title.trim(),
      releaseDate: item.releaseDate ?? null,
      addedAt: item.addedAt,
      pinned: item.pinned === true,
      manualOrder: Number.isFinite(item.manualOrder) ? Number(item.manualOrder) : null,
    })
  }
  return parsed
}

async function hydrateItem(
  item: WatchlistHydrationInput
): Promise<WatchlistHydrationOutput | null> {
  if (item.mediaType === 'movie' || item.mediaType === 'cartoon') {
    const data = await getMoviePageDataShell(item.mediaId)
    if (!data) return null
    const title = data.title || item.title
    const releaseDate = data.releaseDate ?? item.releaseDate ?? null
    return {
      ...item,
      title,
      releaseDate,
      posterPath: data.posterPath,
      voteAverage: data.voteAverage,
      runtimeMinutes: data.runtime ?? null,
      genres: data.genres.slice(0, 3).map((g) => g.name),
      href: detailPathForMedia(item.mediaType, title, releaseDate),
    }
  }

  const tv = await getTvPageDataShell(item.mediaId)
  if (!tv) return null
  const title = tv.title || item.title
  const releaseDate = tv.releaseDate ?? item.releaseDate ?? null
  return {
    ...item,
    title,
    releaseDate,
    posterPath: tv.posterPath,
    voteAverage: tv.voteAverage,
    runtimeMinutes: tv.runtime ?? null,
    genres: tv.genres.slice(0, 3).map((g) => g.name),
    href: detailPathForMedia(item.mediaType, title, releaseDate),
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown
  const items = parseBody(body)
  if (items == null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  if (items.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const resolved = await Promise.all(items.map(hydrateItem))
  return NextResponse.json({
    items: resolved.filter((item): item is WatchlistHydrationOutput => item != null),
  })
}

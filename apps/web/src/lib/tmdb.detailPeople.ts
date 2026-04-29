import type { MoviePageCardItem, MoviePageCastMember, MoviePageCrewRef, TmdbRawMedia } from './tmdb.types'
import { labelsFromGenreIds } from './tmdb.shelfMapping'

interface CreditCastRow {
  id: number
  name: string
  character?: string
  profile_path: string | null
  order: number
}

interface CreditCrewRow {
  id: number
  name: string
  job: string
}

interface CreatedByRow {
  id: number
  name: string
}

export function mapRawToCardItem(m: TmdbRawMedia): MoviePageCardItem {
  const title = (m.title ?? m.name ?? 'Untitled').trim() || 'Untitled'
  return {
    id: m.id,
    title,
    posterPath: m.poster_path ?? null,
    releaseDate: m.release_date ?? m.first_air_date ?? null,
    voteAverage: m.vote_average ?? 0,
    genres: labelsFromGenreIds(m.genre_ids).slice(0, 2),
    runtimeMinutes: null,
  }
}

export function buildMovieCreditsMeta(input: {
  crew: CreditCrewRow[] | undefined
  cast: CreditCastRow[] | undefined
}): {
  directorRef: MoviePageCrewRef | null
  directorNames: string[]
  writers: MoviePageCrewRef[]
  cast: MoviePageCastMember[]
  starsForMeta: MoviePageCrewRef[]
} {
  const crew = input.crew ?? []
  const director = crew.find((c) => c.job === 'Director' && c.name?.trim()) ?? null
  const directorRef: MoviePageCrewRef | null = director ? { id: director.id, name: director.name.trim() } : null

  const directorNames: string[] = []
  const directorSeen = new Set<string>()
  for (const c of crew) {
    if (c.job !== 'Director') continue
    const n = c.name?.trim()
    if (!n || directorSeen.has(n)) continue
    directorSeen.add(n)
    directorNames.push(n)
  }

  const writerSeen = new Set<number>()
  const writers: MoviePageCrewRef[] = []
  for (const c of crew) {
    if (c.job !== 'Screenplay' && c.job !== 'Writer') continue
    if (writerSeen.has(c.id)) continue
    writerSeen.add(c.id)
    const n = c.name?.trim()
    if (n) writers.push({ id: c.id, name: n })
    if (writers.length >= 3) break
  }

  const castRaw = [...(input.cast ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  const cast: MoviePageCastMember[] = castRaw.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character?.trim() ? c.character : null,
    profilePath: c.profile_path,
  }))
  const starsForMeta: MoviePageCrewRef[] = castRaw.slice(0, 6).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return { directorRef, directorNames, writers, cast, starsForMeta }
}

export function buildTvCreditsMeta(input: {
  crew: CreditCrewRow[] | undefined
  cast: CreditCastRow[] | undefined
  createdBy: CreatedByRow[] | undefined
}): {
  directorRef: MoviePageCrewRef | null
  directorNames: string[]
  writers: MoviePageCrewRef[]
  cast: MoviePageCastMember[]
  starsForMeta: MoviePageCrewRef[]
} {
  const crew = input.crew ?? []
  const created = input.createdBy ?? []
  const crewDirector = crew.find((c) => c.job === 'Director' && c.name?.trim()) ?? null
  const directorRef: MoviePageCrewRef | null = crewDirector
    ? { id: crewDirector.id, name: crewDirector.name.trim() }
    : created[0]?.name?.trim()
      ? { id: created[0].id, name: created[0].name.trim() }
      : null

  const directorNames: string[] = []
  const directorSeen = new Set<string>()
  for (const c of crew) {
    if (c.job !== 'Director') continue
    const n = c.name?.trim()
    if (!n || directorSeen.has(n)) continue
    directorSeen.add(n)
    directorNames.push(n)
  }
  for (const cb of created) {
    const n = cb.name?.trim()
    if (!n || directorSeen.has(n)) continue
    directorSeen.add(n)
    directorNames.push(n)
  }

  const writerSeen = new Set<number>()
  const writers: MoviePageCrewRef[] = []
  for (const c of crew) {
    if (c.job !== 'Screenplay' && c.job !== 'Writer') continue
    if (writerSeen.has(c.id)) continue
    writerSeen.add(c.id)
    const n = c.name?.trim()
    if (n) writers.push({ id: c.id, name: n })
    if (writers.length >= 3) break
  }

  const castRaw = [...(input.cast ?? [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  const cast: MoviePageCastMember[] = castRaw.map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character?.trim() ? c.character : null,
    profilePath: c.profile_path,
  }))
  const starsForMeta: MoviePageCrewRef[] = castRaw.slice(0, 6).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return { directorRef, directorNames, writers, cast, starsForMeta }
}

import type { TmdbDiscoverPage } from './tmdb.types'

interface TmdbRawPerson {
  id: number
  name: string
  popularity: number
  profile_path: string | null
  known_for_department?: string | null
}

export interface PopularActorItem {
  id: number
  name: string
  profilePath: string | null
  popularity: number
  department: string | null
}

export interface PersonPageDetail {
  id: number
  name: string
  biography: string
  knownForDepartment: string | null
  alsoKnownAs: string[]
  gender: number | null
  popularity: number | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  profilePath: string | null
  homepage: string | null
  imdbId: string | null
  facebookId: string | null
  instagramId: string | null
  xId: string | null
  tiktokId: string | null
  youtubeId: string | null
}

export interface PersonCreditRowRaw {
  kind: 'movie' | 'tv'
  workId: number
  title: string
  character: string | null
  releaseDate: string | null
  popularity: number
  posterPath: string | null
  genreIds: number[]
}

export interface PersonImageRow {
  filePath: string
  width: number
  height: number
  voteAverage: number
  voteCount: number
}

export async function getPopularActors(
  limit: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    revalidatePeople: number
    cacheTagPeople: string
  }
): Promise<PopularActorItem[]> {
  const pageResponses = await Promise.all(
    [1, 2, 3, 4, 5].map((page) =>
      deps.tmdbFetch<TmdbDiscoverPage<TmdbRawPerson>>(
        '/person/popular',
        { page: String(page), language: 'en-US' },
        { revalidate: deps.revalidatePeople, tags: [deps.cacheTagPeople] }
      ).catch(
        (): TmdbDiscoverPage<TmdbRawPerson> => ({
          results: [],
          page,
          total_pages: 0,
          total_results: 0,
        })
      )
    )
  )
  const seen = new Set<number>()
  const merged: TmdbRawPerson[] = []
  for (const res of pageResponses) {
    for (const p of res.results) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      merged.push(p)
    }
  }
  merged.sort((a, b) => b.popularity - a.popularity)
  return merged.slice(0, limit).map((p) => ({
    id: p.id,
    name: p.name,
    profilePath: p.profile_path,
    popularity: p.popularity,
    department: p.known_for_department ?? null,
  }))
}

export async function getPersonPageData(
  id: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    cacheTagPerson: (id: number) => string
    revalidatePeople: number
    mapPersonPageDetail: (d: {
      id: number
      name?: string
      biography?: string | null
      known_for_department?: string | null
      also_known_as?: string[] | null
      gender?: number | null
      popularity?: number | null
      birthday?: string | null
      deathday?: string | null
      place_of_birth?: string | null
      profile_path?: string | null
      homepage?: string | null
      external_ids?: {
        imdb_id?: string | null
        facebook_id?: string | null
        instagram_id?: string | null
        twitter_id?: string | null
        tiktok_id?: string | null
        youtube_id?: string | null
      }
    }) => PersonPageDetail
  }
): Promise<PersonPageDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  try {
    const personTag = deps.cacheTagPerson(id)
    const d = await deps.tmdbFetch<{
      id: number
      name?: string
      biography?: string | null
      known_for_department?: string | null
      also_known_as?: string[] | null
      gender?: number | null
      popularity?: number | null
      birthday?: string | null
      deathday?: string | null
      place_of_birth?: string | null
      profile_path?: string | null
      homepage?: string | null
      external_ids?: {
        imdb_id?: string | null
        facebook_id?: string | null
        instagram_id?: string | null
        twitter_id?: string | null
        tiktok_id?: string | null
        youtube_id?: string | null
      }
    }>(
      `/person/${id}`,
      { append_to_response: 'external_ids', language: 'en-US' },
      { revalidate: deps.revalidatePeople, tags: [personTag] }
    )
    return deps.mapPersonPageDetail(d)
  } catch {
    return null
  }
}

export async function getPersonImages(
  personId: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    cacheTagPerson: (id: number) => string
    revalidatePeople: number
    mapPersonImages: (rows: Array<{
      file_path?: string | null
      width?: number
      height?: number
      vote_average?: number
      vote_count?: number
    }>) => PersonImageRow[]
  }
): Promise<PersonImageRow[]> {
  if (!Number.isFinite(personId) || personId <= 0) return []
  try {
    const personTag = deps.cacheTagPerson(personId)
    const d = await deps.tmdbFetch<{
      profiles?: Array<{
        file_path?: string | null
        width?: number
        height?: number
        vote_average?: number
        vote_count?: number
      }>
    }>(`/person/${personId}/images`, undefined, {
      revalidate: deps.revalidatePeople,
      tags: [personTag],
    })
    return deps.mapPersonImages(d.profiles ?? [])
  } catch {
    return []
  }
}

export async function getPersonCombinedCredits(
  personId: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    cacheTagPerson: (id: number) => string
    revalidatePeople: number
    mapPersonCombinedCredits: (rows: Array<{
      id: number
      title?: string
      name?: string
      character?: string
      release_date?: string | null
      first_air_date?: string | null
      media_type?: string
      popularity?: number
      poster_path?: string | null
      genre_ids?: number[]
    }>) => PersonCreditRowRaw[]
  }
): Promise<PersonCreditRowRaw[]> {
  if (!Number.isFinite(personId) || personId <= 0) return []
  try {
    const personTag = deps.cacheTagPerson(personId)
    const d = await deps.tmdbFetch<{
      cast?: Array<{
        id: number
        title?: string
        name?: string
        character?: string
        release_date?: string | null
        first_air_date?: string | null
        media_type?: string
        popularity?: number
        poster_path?: string | null
        genre_ids?: number[]
      }>
    }>(
      `/person/${personId}/combined_credits`,
      { language: 'en-US' },
      { revalidate: deps.revalidatePeople, tags: [personTag] }
    )
    return deps.mapPersonCombinedCredits(d.cast ?? [])
  } catch {
    return []
  }
}

export async function getTrendingPeopleForSitemap(
  limit: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    revalidatePeople: number
    mapTrendingPeople: (rows: Array<{
      id: number
      name: string
      profile_path?: string | null
      popularity?: number
      known_for_department?: string | null
    }>, limit: number) => PopularActorItem[]
    hasApiKey: () => boolean
  }
): Promise<PopularActorItem[]> {
  if (!deps.hasApiKey()) return []
  try {
    const res = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawPerson>>(
      '/trending/person/week',
      { language: 'en-US' },
      { revalidate: deps.revalidatePeople }
    )
    return deps.mapTrendingPeople(res.results, limit)
  } catch {
    return []
  }
}

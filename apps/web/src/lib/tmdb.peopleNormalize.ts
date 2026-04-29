interface PersonDetailExternalIds {
  imdb_id?: string | null
  facebook_id?: string | null
  instagram_id?: string | null
  twitter_id?: string | null
  tiktok_id?: string | null
  youtube_id?: string | null
}

interface PersonDetailInput {
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
  external_ids?: PersonDetailExternalIds
}

interface PersonImageInput {
  file_path?: string | null
  width?: number
  height?: number
  vote_average?: number
  vote_count?: number
}

interface PersonCreditCastInput {
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
}

interface TrendingPersonInput {
  id: number
  name: string
  profile_path?: string | null
  popularity?: number
  known_for_department?: string | null
}

export function mapPersonPageDetail(d: PersonDetailInput) {
  const name = d.name?.trim() ? d.name.trim() : `Person ${d.id}`
  const imdbRaw = d.external_ids?.imdb_id?.trim() ? d.external_ids.imdb_id.trim() : null
  const facebookRaw = d.external_ids?.facebook_id?.trim() ? d.external_ids.facebook_id.trim() : null
  const instagramRaw = d.external_ids?.instagram_id?.trim() ? d.external_ids.instagram_id.trim() : null
  const xRaw = d.external_ids?.twitter_id?.trim() ? d.external_ids.twitter_id.trim() : null
  const tiktokRaw = d.external_ids?.tiktok_id?.trim() ? d.external_ids.tiktok_id.trim() : null
  const youtubeRaw = d.external_ids?.youtube_id?.trim() ? d.external_ids.youtube_id.trim() : null
  return {
    id: d.id,
    name,
    biography: (d.biography ?? '').trim(),
    knownForDepartment: d.known_for_department?.trim() || null,
    alsoKnownAs: (d.also_known_as ?? []).map((item) => item.trim()).filter(Boolean),
    gender: Number.isFinite(d.gender) ? (d.gender ?? null) : null,
    popularity: Number.isFinite(d.popularity) ? (d.popularity ?? null) : null,
    birthday: d.birthday?.trim() || null,
    deathday: d.deathday?.trim() || null,
    placeOfBirth: d.place_of_birth?.trim() || null,
    profilePath: d.profile_path?.trim() ? d.profile_path : null,
    homepage: d.homepage?.trim() || null,
    imdbId: imdbRaw,
    facebookId: facebookRaw,
    instagramId: instagramRaw,
    xId: xRaw,
    tiktokId: tiktokRaw,
    youtubeId: youtubeRaw,
  }
}

export function mapPersonImages(rows: PersonImageInput[]) {
  const prepared: Array<{
    filePath: string
    width: number
    height: number
    voteAverage: number
    voteCount: number
  }> = []
  for (const row of rows) {
    const filePath = row.file_path?.trim() ?? ''
    if (!filePath) continue
    const width = Number.isFinite(row.width) ? Number(row.width) : 0
    const height = Number.isFinite(row.height) ? Number(row.height) : 0
    if (width <= 0 || height <= 0) continue
    prepared.push({
      filePath,
      width,
      height,
      voteAverage: typeof row.vote_average === 'number' ? row.vote_average : 0,
      voteCount: typeof row.vote_count === 'number' ? row.vote_count : 0,
    })
  }

  const unique = new Map<string, (typeof prepared)[number]>()
  for (const row of prepared) unique.set(row.filePath, row)
  return [...unique.values()].sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
    if (b.voteAverage !== a.voteAverage) return b.voteAverage - a.voteAverage
    return b.width * b.height - a.width * a.height
  })
}

export function mapPersonCombinedCredits(castRows: PersonCreditCastInput[]) {
  const rows: Array<{
    kind: 'movie' | 'tv'
    workId: number
    title: string
    character: string | null
    releaseDate: string | null
    popularity: number
    posterPath: string | null
    genreIds: number[]
  }> = []
  for (const c of castRows) {
    if (c.media_type !== 'movie' && c.media_type !== 'tv') continue
    const title = (c.media_type === 'movie' ? c.title : c.name)?.trim() ?? ''
    if (!title) continue
    const releaseDate =
      c.media_type === 'movie' ? c.release_date?.trim() || null : c.first_air_date?.trim() || null
    rows.push({
      kind: c.media_type,
      workId: c.id,
      title,
      character: c.character?.trim() || null,
      releaseDate,
      popularity: typeof c.popularity === 'number' ? c.popularity : 0,
      posterPath: c.poster_path?.trim() || null,
      genreIds: Array.isArray(c.genre_ids)
        ? c.genre_ids.filter((item): item is number => Number.isFinite(item))
        : [],
    })
  }
  rows.sort((a, b) => b.popularity - a.popularity)
  return rows.slice(0, 72)
}

export function mapTrendingPeople(rows: TrendingPersonInput[], limit: number) {
  return rows.slice(0, limit).map((p) => ({
    id: p.id,
    name: p.name,
    profilePath: p.profile_path ?? null,
    popularity: typeof p.popularity === 'number' ? p.popularity : 0,
    department: p.known_for_department ?? null,
  }))
}

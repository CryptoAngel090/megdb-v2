import type { HeroItem, ShelfItem, TmdbDiscoverPage, TmdbPaginated, TmdbRawMedia, TmdbVideosResponse } from './tmdb.types'

const HERO_MOVIE_COUNT = 10
const HERO_DISCOVER_MAX_PAGES = 25
const HERO_PRIMARY_RELEASE_YEAR = 2026

function heroReleaseInYearWindow(iso: string | undefined, year: number, endIso: string): boolean {
  if (!iso || iso.length < 10) return false
  const d = iso.slice(0, 10)
  return d >= `${year}-01-01` && d <= endIso
}

function passesHeroBlockbusterMovie(
  m: TmdbRawMedia,
  deps: {
    isCombatSportsOrWrestlingProgram: (m: TmdbRawMedia) => boolean
    passesShelfGenreFilter: (m: TmdbRawMedia) => boolean
    tvMovieGenreId: number
    heroExclude: ReadonlySet<number>
  }
): boolean {
  if (!m.backdrop_path || !m.poster_path) return false
  if (deps.isCombatSportsOrWrestlingProgram(m)) return false
  if (!deps.passesShelfGenreFilter(m)) return false
  if (m.genre_ids?.includes(deps.tvMovieGenreId)) return false
  if (m.genre_ids?.some((id) => deps.heroExclude.has(id))) return false
  const v = m.vote_count ?? 0
  const p = m.popularity ?? 0
  if (p >= 48) return true
  if (v >= 280) return true
  if (v >= 200 && p >= 30) return true
  if (v >= 140 && p >= 38) return true
  if (v >= 95 && p >= 42) return true
  return false
}

export async function getHeroItems(
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    revalidateFast: number
    cacheTagTrending: string
    shelfExclude: string
    heroExclude: ReadonlySet<number>
    tvMovieGenreId: number
    genreNames: Record<number, string>
    mergeUpToTwoGenres: (primary: string[], fallback: string[]) => string[]
    pickTrailerKeyFromResults: (results: TmdbVideosResponse['results'] | undefined) => string | null
    isCombatSportsOrWrestlingProgram: (m: TmdbRawMedia) => boolean
    passesShelfGenreFilter: (m: TmdbRawMedia) => boolean
  }
): Promise<HeroItem[]> {
  const year = HERO_PRIMARY_RELEASE_YEAR
  const today = new Date().toISOString().slice(0, 10)
  const yearEnd = `${year}-12-31`
  const endIso = today <= yearEnd ? today : yearEnd

  const filterHero = (items: TmdbRawMedia[]) =>
    items.filter(
      (m) =>
        heroReleaseInYearWindow(m.release_date, year, endIso) &&
        passesHeroBlockbusterMovie(m, deps)
    )

  const picked: TmdbRawMedia[] = []
  const seen = new Set<number>()
  let page = 1
  let totalPages = 1
  try {
    while (
      picked.length < HERO_MOVIE_COUNT &&
      page <= totalPages &&
      page <= HERO_DISCOVER_MAX_PAGES
    ) {
      const res = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(
        '/discover/movie',
        {
          primary_release_year: String(year),
          'primary_release_date.gte': `${year}-01-01`,
          'primary_release_date.lte': endIso,
          sort_by: 'primary_release_date.desc',
          'vote_count.gte': '120',
          without_genres: deps.shelfExclude,
          page: String(page),
        },
        { revalidate: deps.revalidateFast }
      )
      totalPages = Math.max(1, res.total_pages)
      for (const m of filterHero(res.results)) {
        if (picked.length >= HERO_MOVIE_COUNT) break
        if (seen.has(m.id)) continue
        seen.add(m.id)
        picked.push(m)
      }
      page += 1
    }
  } catch {}

  if (picked.length === 0) {
    try {
      const trending = await deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
        '/trending/movie/week',
        {},
        { revalidate: deps.revalidateFast, tags: [deps.cacheTagTrending] }
      )
      for (const m of trending.results) {
        if (picked.length >= HERO_MOVIE_COUNT) break
        if (!m.backdrop_path?.trim() || !m.poster_path) continue
        if (deps.isCombatSportsOrWrestlingProgram(m)) continue
        if (!deps.passesShelfGenreFilter(m)) continue
        if (m.genre_ids?.includes(deps.tvMovieGenreId)) continue
        if (seen.has(m.id)) continue
        seen.add(m.id)
        picked.push(m)
      }
    } catch {}
  }

  if (picked.length === 0) return []
  const candidates = picked.slice(0, Math.min(HERO_MOVIE_COUNT, picked.length))
  const listGenreLabels = (raw: TmdbRawMedia) =>
    (raw.genre_ids ?? []).map((id) => deps.genreNames[id]).filter(Boolean) as string[]

  return Promise.all(
    candidates.map(async (m) => {
      const dateStr = m.release_date || m.first_air_date || ''
      const listLabels = listGenreLabels(m)
      try {
        const d = await deps.tmdbFetch<{
          runtime?: number | null
          genres?: { name: string }[]
          videos?: TmdbVideosResponse
        }>(`/movie/${m.id}`, { append_to_response: 'videos' }, { revalidate: deps.revalidateFast })
        const detailNames = (d.genres ?? []).map((g) => g.name)
        const genres = deps.mergeUpToTwoGenres(detailNames, listLabels)
        const runtime = d.runtime != null && d.runtime > 0 ? d.runtime : null
        const trailerKey = deps.pickTrailerKeyFromResults(d.videos?.results)
        return {
          id: m.id,
          type: 'movie' as const,
          title: m.title ?? m.name ?? 'Untitled',
          overview: m.overview ?? '',
          backdropPath: m.backdrop_path!,
          voteAverage: m.vote_average,
          releaseDate: dateStr ? new Date(dateStr) : new Date(),
          genres,
          runtime,
          trailerKey,
        } satisfies HeroItem
      } catch {
        return {
          id: m.id,
          type: 'movie' as const,
          title: m.title ?? m.name ?? 'Untitled',
          overview: m.overview ?? '',
          backdropPath: m.backdrop_path!,
          voteAverage: m.vote_average,
          releaseDate: dateStr ? new Date(dateStr) : new Date(),
          genres: deps.mergeUpToTwoGenres([], listLabels),
          runtime: null,
          trailerKey: null,
        } satisfies HeroItem
      }
    })
  )
}

const ACCLAIMED_JUNK_RE = new RegExp(
  [
    'behind the scenes',
    'making of',
    'featurette',
    '\\brecap\\b',
    'highlights',
    'official trailer',
    'teaser trailer',
    'fan edit',
    'fanedit',
    '\\bcompilation\\b',
    'from the vault',
    'anniversary edition',
    "collector's edition",
    'double feature',
    'triple feature',
  ].join('|'),
  'i'
)

function passesAcclaimedRecentSoft(m: TmdbRawMedia): boolean {
  const v = m.vote_count ?? 0
  const r = m.vote_average ?? 0
  const p = m.popularity ?? 0
  if (r >= 7 && v >= 120) return true
  if (r >= 6.8 && v >= 180) return true
  if (r >= 6.6 && v >= 140 && p >= 18) return true
  if (r >= 6.5 && v >= 220) return true
  return false
}

function passesAcclaimedRecentEmergency(m: TmdbRawMedia): boolean {
  const v = m.vote_count ?? 0
  const r = m.vote_average ?? 0
  const p = m.popularity ?? 0
  if (r >= 6.4 && v >= 90 && p >= 14) return true
  if (r >= 6.2 && v >= 120 && p >= 10) return true
  return false
}

function isAcclaimedRecentJunk(m: TmdbRawMedia): boolean {
  const blob = [m.title, m.original_title, m.overview]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join('\n')
  return ACCLAIMED_JUNK_RE.test(blob)
}

function acclaimedRecentQualityScore(m: TmdbRawMedia): number {
  const v = Math.log10((m.vote_count ?? 0) + 1)
  const r = m.vote_average ?? 0
  const p = Math.log1p(m.popularity ?? 0)
  let s = r * v * 1.45 + p * 0.38
  if (m.backdrop_path != null && m.backdrop_path !== '') s += 0.15
  return s
}

const ACCLAIMED_STRICT_HEAD = 8
const ACCLAIMED_SOFT_MAX_WHEN_STRICT_FULL = 2
const MIN_ACCLAIMED_HOME = 10

type AcclaimedPhase = {
  dateGte: string
  voteGte: string
  ratingGte: string
  sortBy: string
  maxPages: number
  soft: boolean
}

async function runAcclaimedPhases(
  today: string,
  phases: AcclaimedPhase[],
  consider: (m: TmdbRawMedia, soft: boolean) => void,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    shelfExclude: string
    revalidateModerate: number
  }
): Promise<void> {
  for (const ph of phases) {
    for (let page = 1; page <= ph.maxPages; page += 1) {
      const res = await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(
        '/discover/movie',
        {
          'primary_release_date.gte': ph.dateGte,
          'primary_release_date.lte': today,
          sort_by: ph.sortBy,
          'vote_count.gte': ph.voteGte,
          'vote_average.gte': ph.ratingGte,
          without_genres: deps.shelfExclude,
          page: String(page),
        },
        { revalidate: deps.revalidateModerate }
      )
      for (const m of res.results) consider(m, ph.soft)
      const lastPage = Math.min(ph.maxPages, Math.max(1, res.total_pages))
      if (page >= lastPage) break
    }
  }
}

function mergeAcclaimedPools(
  strictPool: TmdbRawMedia[],
  softPool: TmdbRawMedia[],
  cap: number
): TmdbRawMedia[] {
  const sortDesc = (a: TmdbRawMedia, b: TmdbRawMedia) =>
    acclaimedRecentQualityScore(b) - acclaimedRecentQualityScore(a)
  const strict = [...strictPool].sort(sortDesc)
  const soft = [...softPool].sort(sortDesc)
  const out: TmdbRawMedia[] = []
  const outIds = new Set<number>()
  const push = (m: TmdbRawMedia) => {
    if (outIds.has(m.id)) return
    out.push(m)
    outIds.add(m.id)
  }
  const headStrict = Math.min(ACCLAIMED_STRICT_HEAD, cap, strict.length)
  for (let i = 0; i < headStrict; i += 1) push(strict[i]!)
  if (out.length >= ACCLAIMED_STRICT_HEAD) {
    let softAdded = 0
    for (const m of soft) {
      if (out.length >= cap) break
      if (softAdded >= ACCLAIMED_SOFT_MAX_WHEN_STRICT_FULL) break
      push(m)
      softAdded += 1
    }
  } else {
    for (const m of soft) {
      if (out.length >= cap) break
      push(m)
      if (out.length >= MIN_ACCLAIMED_HOME) break
    }
  }
  for (let i = headStrict; i < strict.length; i += 1) {
    if (out.length >= cap) break
    push(strict[i]!)
  }
  for (const m of soft) {
    if (out.length >= cap) break
    push(m)
  }
  return out.slice(0, cap)
}

export async function getBestOf2026(
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem
    enrichShelfItemsWithDetails: (items: ShelfItem[], revalidate: number) => Promise<ShelfItem[]>
    revalidateModerate: number
    cacheTagHomeModerate: string
    shelfExclude: string
  }
): Promise<ShelfItem[]> {
  const res = await deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
    '/discover/movie',
    {
      primary_release_year: '2026',
      sort_by: 'popularity.desc',
      'vote_count.gte': '120',
      without_genres: deps.shelfExclude,
    },
    { revalidate: deps.revalidateModerate, tags: [deps.cacheTagHomeModerate] }
  )
  const items = res.results.slice(0, 20).map((m) => deps.mapToShelfItem(m, 'movie'))
  return deps.enrichShelfItemsWithDetails(items, deps.revalidateModerate)
}

export async function getTrendingNow(
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem
    enrichShelfItemsWithDetails: (items: ShelfItem[], revalidate: number) => Promise<ShelfItem[]>
    revalidateFast: number
    cacheTagTrending: string
    isMainstreamTrendingMovie: (m: TmdbRawMedia, todayIso: string) => boolean
    applyTrendingRecencyBias: (rows: TmdbRawMedia[], todayIso: string) => TmdbRawMedia[]
  }
): Promise<ShelfItem[]> {
  const todayIso = new Date().toISOString().slice(0, 10)
  const collected: TmdbRawMedia[] = []
  const seen = new Set<number>()
  const maxPages = 6
  for (let page = 1; page <= maxPages && collected.length < 20; page += 1) {
    const res = await deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
      '/trending/movie/day',
      { page: String(page) },
      { revalidate: deps.revalidateFast, tags: [deps.cacheTagTrending] }
    )
    for (const row of res.results) {
      if (collected.length >= 20) break
      if (seen.has(row.id)) continue
      if (!deps.isMainstreamTrendingMovie(row, todayIso)) continue
      seen.add(row.id)
      collected.push(row)
    }
  }
  const items = deps
    .applyTrendingRecencyBias(collected, todayIso)
    .slice(0, 20)
    .map((m) => deps.mapToShelfItem(m, 'movie'))
  return deps.enrichShelfItemsWithDetails(items, deps.revalidateFast)
}

export async function getNewReleases(
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem
    enrichShelfItemsWithDetails: (items: ShelfItem[], revalidate: number) => Promise<ShelfItem[]>
    revalidateFast: number
    cacheTagTrending: string
    shelfExclude: string
    isNewThisWeekMovie: (m: TmdbRawMedia) => boolean
    isNewThisWeekSeries: (m: TmdbRawMedia) => boolean
  }
): Promise<ShelfItem[]> {
  const today = new Date().toISOString().slice(0, 10)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [moviesRes, tvRes] = await Promise.all([
    deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
      '/discover/movie',
      {
        'primary_release_date.gte': twoWeeksAgo,
        'primary_release_date.lte': today,
        sort_by: 'popularity.desc',
        'vote_count.gte': '5',
        without_genres: deps.shelfExclude,
      },
      { revalidate: deps.revalidateFast, tags: [deps.cacheTagTrending] }
    ),
    deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
      '/discover/tv',
      {
        'first_air_date.gte': twoWeeksAgo,
        'first_air_date.lte': today,
        sort_by: 'popularity.desc',
        'vote_count.gte': '5',
        with_type: '2|4',
        without_genres: deps.shelfExclude,
      },
      { revalidate: deps.revalidateFast, tags: [deps.cacheTagTrending] }
    ),
  ])
  const items = [
    ...moviesRes.results.filter(deps.isNewThisWeekMovie).map((m) => deps.mapToShelfItem(m, 'movie')),
    ...tvRes.results.filter(deps.isNewThisWeekSeries).map((m) => deps.mapToShelfItem(m, 'series')),
  ]
    .sort((a, b) => (b.releaseDate?.getTime() ?? 0) - (a.releaseDate?.getTime() ?? 0))
    .slice(0, 20)
  return deps.enrichShelfItemsWithDetails(items, deps.revalidateFast)
}

export async function getAcclaimedRecentMovies(
  limit: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem
    enrichShelfItemsWithDetails: (items: ShelfItem[], revalidate: number) => Promise<ShelfItem[]>
    revalidateModerate: number
    shelfExclude: string
    isNewThisWeekMovie: (m: TmdbRawMedia) => boolean
  }
): Promise<ShelfItem[]> {
  const today = new Date().toISOString().slice(0, 10)
  const d = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const cap = Math.min(Math.max(1, limit), 20)
  const strictById = new Map<number, TmdbRawMedia>()
  const softById = new Map<number, TmdbRawMedia>()
  const baseOk = (m: TmdbRawMedia) =>
    deps.isNewThisWeekMovie(m) &&
    m.poster_path != null &&
    m.poster_path !== '' &&
    !isAcclaimedRecentJunk(m)
  const consider = (m: TmdbRawMedia, soft: boolean) => {
    if (!baseOk(m)) return
    if (soft && !passesAcclaimedRecentSoft(m)) return
    if (!soft) {
      strictById.set(m.id, m)
      softById.delete(m.id)
    } else if (!strictById.has(m.id)) {
      softById.set(m.id, m)
    }
  }
  const mainPhases: AcclaimedPhase[] = [
    { dateGte: d(90), voteGte: '200', ratingGte: '7', sortBy: 'vote_average.desc', maxPages: 12, soft: false },
    { dateGte: d(120), voteGte: '180', ratingGte: '6.9', sortBy: 'vote_average.desc', maxPages: 10, soft: false },
    { dateGte: d(90), voteGte: '120', ratingGte: '6.7', sortBy: 'vote_average.desc', maxPages: 10, soft: true },
    { dateGte: d(120), voteGte: '100', ratingGte: '6.5', sortBy: 'popularity.desc', maxPages: 10, soft: true },
  ]
  await runAcclaimedPhases(today, mainPhases, consider, deps)
  let merged = mergeAcclaimedPools([...strictById.values()], [...softById.values()], cap)
  if (merged.length < Math.min(MIN_ACCLAIMED_HOME, cap)) {
    const emergency: AcclaimedPhase[] = [
      { dateGte: d(150), voteGte: '80', ratingGte: '6.2', sortBy: 'popularity.desc', maxPages: 8, soft: true },
    ]
    const strictBefore = new Set(merged.map((m) => m.id))
    await runAcclaimedPhases(
      today,
      emergency,
      (m) => {
        if (!baseOk(m) || strictBefore.has(m.id)) return
        if (!passesAcclaimedRecentEmergency(m)) return
        if (!strictById.has(m.id)) softById.set(m.id, m)
      },
      deps
    )
    merged = mergeAcclaimedPools([...strictById.values()], [...softById.values()], cap)
  }
  const items = merged.map((m) => deps.mapToShelfItem(m, 'movie'))
  return deps.enrichShelfItemsWithDetails(items, deps.revalidateModerate)
}

export async function getBestMoviesAllTime(
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem
    enrichShelfItemsWithDetails: (items: ShelfItem[], revalidate: number) => Promise<ShelfItem[]>
    revalidateAllTime: number
    cacheTagAllTime: string
  }
): Promise<ShelfItem[]> {
  const res = await deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>('/movie/top_rated', undefined, {
    revalidate: deps.revalidateAllTime,
    tags: [deps.cacheTagAllTime],
  })
  const items = res.results.slice(0, 20).map((m) => deps.mapToShelfItem(m, 'movie'))
  return deps.enrichShelfItemsWithDetails(items, deps.revalidateAllTime)
}

export async function getBestSeriesAllTime(
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    mapToShelfItem: (m: TmdbRawMedia, type: ShelfItem['type']) => ShelfItem
    enrichShelfItemsWithDetails: (items: ShelfItem[], revalidate: number) => Promise<ShelfItem[]>
    revalidateAllTime: number
    cacheTagAllTime: string
    shelfExclude: string
  }
): Promise<ShelfItem[]> {
  const res = await deps.tmdbFetch<TmdbPaginated<TmdbRawMedia>>(
    '/discover/tv',
    {
      sort_by: 'vote_average.desc',
      'vote_count.gte': '200',
      with_type: '4',
      without_genres: deps.shelfExclude,
    },
    { revalidate: deps.revalidateAllTime, tags: [deps.cacheTagAllTime] }
  )
  const items = res.results
    .filter((m) => m.vote_average >= 8.0)
    .slice(0, 20)
    .map((m) => deps.mapToShelfItem(m, 'series'))
  return deps.enrichShelfItemsWithDetails(items, deps.revalidateAllTime)
}

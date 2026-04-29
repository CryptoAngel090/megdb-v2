import type { DiscoverMoviesBrowseInput, DiscoverSeriesBrowseInput } from './tmdb.discoverParams'
import type { TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

const MOSAIC_HERO_MOVIE_YEAR = 2026

function releaseDateYearIs(d: string | undefined, year: number): boolean {
  if (d == null || d.length < 4) return false
  const y = Number.parseInt(d.slice(0, 4), 10)
  return Number.isFinite(y) && y === year
}

function isMovieListRow(m: TmdbRawMedia): boolean {
  return m.title != null && m.title !== ''
}

function isTheatricalMovie2026(m: TmdbRawMedia, fromDiscover: boolean): boolean {
  if (!isMovieListRow(m)) return false
  if (m.release_date == null || m.release_date === '') return fromDiscover
  return releaseDateYearIs(m.release_date, MOSAIC_HERO_MOVIE_YEAR)
}

function mosaicPopularityScore(m: TmdbRawMedia): number {
  const votes = m.vote_count ?? 0
  return m.popularity + Math.log10(votes + 1) * 2.5
}

function passesMosaicFeatureFilm(
  m: TmdbRawMedia,
  fromDiscover: boolean,
  tvMovieGenreId: number,
  passesShelfGenreFilter: (m: TmdbRawMedia) => boolean
): boolean {
  const ids = m.genre_ids
  if (ids?.includes(16)) return false
  if (ids?.includes(tvMovieGenreId)) return false
  if (!passesShelfGenreFilter(m)) return false
  if (!ids?.length && !fromDiscover) return false
  return true
}

export async function getTopMovies2026MosaicPosterUrls(
  maxUrls: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    discoverMoviesBrowse: (
      input: DiscoverMoviesBrowseInput,
      mode: 'discover' | 'trending',
      comingYear?: number
    ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>
    getImageUrl: (path: string | null | undefined, size?: string) => string
    shelfExclude: string
    tvMovieGenreId: number
    passesShelfGenreFilter: (m: TmdbRawMedia) => boolean
  }
): Promise<string[]> {
  const y = String(MOSAIC_HERO_MOVIE_YEAR)
  const highPages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const midPages = [1, 2, 3, 4, 5, 6, 7, 8]
  const emptyDiscoverPage = (): TmdbDiscoverPage<TmdbRawMedia> => ({
    page: 1,
    total_pages: 0,
    total_results: 0,
    results: [],
  })
  const safeDiscoverMoviesBrowse = async (
    input: DiscoverMoviesBrowseInput,
    mode: 'discover' | 'trending',
    comingYear?: number
  ): Promise<TmdbDiscoverPage<TmdbRawMedia>> => {
    try {
      return await deps.discoverMoviesBrowse(input, mode, comingYear)
    } catch {
      return emptyDiscoverPage()
    }
  }
  const safeTmdbPageFetch = async (
    endpoint: string,
    params: Record<string, string>
  ): Promise<TmdbDiscoverPage<TmdbRawMedia>> => {
    try {
      return await deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>(endpoint, params)
    } catch {
      return emptyDiscoverPage()
    }
  }

  const [discoverHigh, discoverMid, trendW1, trendW2, trendW3, nowPlaying, upcoming, upcomingP2] =
    await Promise.all([
      Promise.all(
        highPages.map((page) =>
          safeDiscoverMoviesBrowse(
            {
              year: y,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '500',
              without_genres: deps.shelfExclude,
            },
            'discover',
            undefined
          )
        )
      ),
      Promise.all(
        midPages.map((page) =>
          safeDiscoverMoviesBrowse(
            {
              year: y,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '120',
              without_genres: deps.shelfExclude,
            },
            'discover',
            undefined
          )
        )
      ),
      safeTmdbPageFetch('/trending/movie/week', { page: '1' }),
      safeTmdbPageFetch('/trending/movie/week', { page: '2' }),
      safeTmdbPageFetch('/trending/movie/week', { page: '3' }),
      safeTmdbPageFetch('/movie/now_playing', { page: '1' }),
      safeTmdbPageFetch('/movie/upcoming', { page: '1' }),
      safeTmdbPageFetch('/movie/upcoming', { page: '2' }),
    ])

  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    if (!isTheatricalMovie2026(m, fromDiscover)) return
    if (
      !passesMosaicFeatureFilm(
        m,
        fromDiscover,
        deps.tvMovieGenreId,
        deps.passesShelfGenreFilter
      )
    )
      return
    const prev = pool.get(m.id)
    if (prev == null || mosaicPopularityScore(m) > mosaicPopularityScore(prev)) pool.set(m.id, m)
  }

  for (const res of discoverHigh) for (const m of res.results) consider(m, true)
  for (const res of discoverMid) for (const m of res.results) consider(m, true)
  for (const m of trendW1.results) consider(m, false)
  for (const m of trendW2.results) consider(m, false)
  for (const m of trendW3.results) consider(m, false)
  for (const m of nowPlaying.results) consider(m, false)
  for (const m of upcoming.results) consider(m, false)
  for (const m of upcomingP2.results) consider(m, false)

  const minUniqueTarget = Math.max(160, Math.floor(maxUrls * 0.55))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const year of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          safeDiscoverMoviesBrowse(
            {
              year,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '8',
              without_genres: deps.shelfExclude,
            },
            'discover',
            undefined
          )
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          if (!passesMosaicFeatureFilm(m, true, deps.tvMovieGenreId, deps.passesShelfGenreFilter))
            continue
          const prev = pool.get(m.id)
          if (prev == null || mosaicPopularityScore(m) > mosaicPopularityScore(prev))
            pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => mosaicPopularityScore(b) - mosaicPopularityScore(a))
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => deps.getImageUrl(m.poster_path, 'w154'))
}

export async function getTopSeries2026MosaicPosterUrls(
  maxUrls: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    discoverSeriesBrowse: (
      input: DiscoverSeriesBrowseInput,
      mode: 'discover' | 'trending',
      comingYear?: number
    ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>
    getImageUrl: (path: string | null | undefined, size?: string) => string
    shelfExclude: string
    tvMovieGenreId: number
    passesShelfGenreFilter: (m: TmdbRawMedia) => boolean
  }
): Promise<string[]> {
  const year = '2026'
  const [discoverHigh, discoverMid, trendW1, trendW2, popular] = await Promise.all([
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '120',
      without_genres: deps.shelfExclude,
      page: '1',
    }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '20',
      without_genres: deps.shelfExclude,
      page: '2',
    }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '1' }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '2' }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/tv/popular', { page: '1' }),
  ])

  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    const y = Number.parseInt((m.first_air_date ?? '').slice(0, 4), 10)
    if (!Number.isFinite(y)) {
      if (!fromDiscover) return
    } else if (y !== 2026) return
    if (
      !passesMosaicFeatureFilm(
        m,
        fromDiscover,
        deps.tvMovieGenreId,
        deps.passesShelfGenreFilter
      )
    )
      return
    const prev = pool.get(m.id)
    if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
  }

  for (const m of discoverHigh.results) consider(m, true)
  for (const m of discoverMid.results) consider(m, true)
  for (const m of trendW1.results) consider(m, false)
  for (const m of trendW2.results) consider(m, false)
  for (const m of popular.results) consider(m, false)

  const minUniqueTarget = Math.max(150, Math.floor(maxUrls * 0.5))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const y of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          deps.discoverSeriesBrowse(
            {
              year: y,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '5',
              without_genres: deps.shelfExclude,
            },
            'discover',
            undefined
          )
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          const ids = m.genre_ids ?? []
          if (ids.includes(16)) continue
          if (ids.includes(deps.tvMovieGenreId)) continue
          const prev = pool.get(m.id)
          if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => deps.getImageUrl(m.poster_path, 'w154'))
}

export async function getTopTvShows2026MosaicPosterUrls(
  maxUrls: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    discoverSeriesBrowse: (
      input: DiscoverSeriesBrowseInput,
      mode: 'discover' | 'trending',
      comingYear?: number
    ) => Promise<TmdbDiscoverPage<TmdbRawMedia>>
    getImageUrl: (path: string | null | undefined, size?: string) => string
    tvShowOnlyWithGenres: string
    tvShowOnlyGenreIds: readonly string[]
  }
): Promise<string[]> {
  const year = '2026'
  const [discoverHigh, discoverMid, trendW1, trendW2, popular] = await Promise.all([
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '80',
      with_genres: deps.tvShowOnlyWithGenres,
      without_genres: '16',
      page: '1',
    }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10',
      with_genres: deps.tvShowOnlyWithGenres,
      without_genres: '16',
      page: '2',
    }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '1' }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/tv/week', { page: '2' }),
    deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/tv/popular', { page: '1' }),
  ])

  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    const y = Number.parseInt((m.first_air_date ?? '').slice(0, 4), 10)
    if (!Number.isFinite(y)) {
      if (!fromDiscover) return
    } else if (y !== 2026) return
    const ids = new Set((m.genre_ids ?? []).map(String))
    if (!deps.tvShowOnlyGenreIds.some((id) => ids.has(id))) return
    if (ids.has('16')) return
    if (!ids.size && !fromDiscover) return
    const prev = pool.get(m.id)
    if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
  }

  for (const m of discoverHigh.results) consider(m, true)
  for (const m of discoverMid.results) consider(m, true)
  for (const m of trendW1.results) consider(m, false)
  for (const m of trendW2.results) consider(m, false)
  for (const m of popular.results) consider(m, false)

  const minUniqueTarget = Math.max(150, Math.floor(maxUrls * 0.5))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const backfillYear of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          deps.discoverSeriesBrowse(
            {
              year: backfillYear,
              sort_by: 'popularity.desc',
              page,
              vote_count_gte: '5',
              genre: deps.tvShowOnlyWithGenres,
              without_genres: '16',
            },
            'discover',
            undefined
          )
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          const ids = new Set((m.genre_ids ?? []).map(String))
          if (!deps.tvShowOnlyGenreIds.some((id) => ids.has(id))) continue
          if (ids.has('16')) continue
          const prev = pool.get(m.id)
          if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => deps.getImageUrl(m.poster_path, 'w154'))
}

export async function getTopCartoons2026MosaicPosterUrls(
  maxUrls: number,
  deps: {
    tmdbFetch: <T>(
      endpoint: string,
      params?: Record<string, string>,
      init?: { revalidate?: number; tags?: string[] }
    ) => Promise<T>
    getImageUrl: (path: string | null | undefined, size?: string) => string
    cartoonWithoutGenres: string
    tvMovieGenreId: number
  }
): Promise<string[]> {
  const year = '2026'
  const highPages = [1, 2, 3, 4, 5, 6]
  const midPages = [1, 2, 3, 4, 5, 6, 7, 8]
  const trendingPages = [1, 2, 3, 4, 5, 6]
  const popularPages = [1, 2, 3, 4, 5, 6]

  const [discoverHigh, discoverMid, trendingBatch, popularBatch] = await Promise.all([
    Promise.all(
      highPages.map((page) =>
        deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
          primary_release_year: year,
          sort_by: 'popularity.desc',
          'vote_count.gte': '80',
          with_genres: '16',
          without_genres: deps.cartoonWithoutGenres,
          page: String(page),
        })
      )
    ),
    Promise.all(
      midPages.map((page) =>
        deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
          primary_release_year: year,
          sort_by: 'popularity.desc',
          'vote_count.gte': '10',
          with_genres: '16',
          without_genres: deps.cartoonWithoutGenres,
          page: String(page),
        })
      )
    ),
    Promise.all(
      trendingPages.map((page) =>
        deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/trending/movie/week', { page: String(page) })
      )
    ),
    Promise.all(
      popularPages.map((page) =>
        deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/movie/popular', { page: String(page) })
      )
    ),
  ])
  const pool = new Map<number, TmdbRawMedia>()
  const consider = (m: TmdbRawMedia, fromDiscover: boolean) => {
    if (!m.poster_path) return
    const y = Number.parseInt((m.release_date ?? '').slice(0, 4), 10)
    if (!Number.isFinite(y)) {
      if (!fromDiscover) return
    } else if (y !== 2026) return
    const ids = m.genre_ids ?? []
    if (!ids.includes(16)) return
    if (ids.includes(deps.tvMovieGenreId)) return
    if (!ids.length && !fromDiscover) return
    const prev = pool.get(m.id)
    if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
  }

  for (const res of discoverHigh) for (const m of res.results) consider(m, true)
  for (const res of discoverMid) for (const m of res.results) consider(m, true)
  for (const res of trendingBatch) for (const m of res.results) consider(m, false)
  for (const res of popularBatch) for (const m of res.results) consider(m, false)

  const minUniqueTarget = Math.max(140, Math.floor(maxUrls * 0.5))
  if (pool.size < minUniqueTarget) {
    const backfillYears = ['2025', '2024']
    for (const y of backfillYears) {
      const backfill = await Promise.all(
        [1, 2, 3, 4, 5, 6].map((page) =>
          deps.tmdbFetch<TmdbDiscoverPage<TmdbRawMedia>>('/discover/movie', {
            primary_release_year: y,
            sort_by: 'popularity.desc',
            'vote_count.gte': '5',
            with_genres: '16',
            without_genres: deps.cartoonWithoutGenres,
            page: String(page),
          })
        )
      )
      for (const res of backfill) {
        for (const m of res.results) {
          if (!m.poster_path) continue
          const ids = m.genre_ids ?? []
          if (!ids.includes(16) || ids.includes(deps.tvMovieGenreId)) continue
          const prev = pool.get(m.id)
          if (prev == null || m.popularity > prev.popularity) pool.set(m.id, m)
        }
      }
      if (pool.size >= minUniqueTarget) break
    }
  }

  return [...pool.values()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxUrls)
    .filter(
      (m): m is TmdbRawMedia & { poster_path: string } =>
        m.poster_path != null && m.poster_path !== ''
    )
    .map((m) => deps.getImageUrl(m.poster_path, 'w154'))
}

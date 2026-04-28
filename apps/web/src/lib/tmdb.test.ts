import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyTrendingRecencyBias,
  COMING_BLOCKBUSTER_MOVIE_VOTE_MIN,
  COMING_BLOCKBUSTER_TV_VOTE_MIN,
  compareShelfItemsByUpcomingReleaseAsc,
  discoverCartoonsStateToBrowseInput,
  discoverCartoonsStateToFetchParams,
  discoverSeriesStateToBrowseInput,
  discoverStateToBrowseInput,
  isMainstreamTrendingMovie,
  discoverTvShowsStateToBrowseInput,
  discoverTvShowsStateToFetchParams,
  discoverStateToFetchParams,
  getTopMovies2026MosaicPosterUrls,
  getImageUrl,
  parseCartoonsDiscoverSearchParams,
  parseMoviesDiscoverSearchParams,
  parseSeriesDiscoverSearchParams,
  parseTvShowsDiscoverSearchParams,
  type ShelfItem,
} from './tmdb'

describe('getImageUrl', () => {
  it('returns empty string when path is missing', () => {
    expect(getImageUrl(null)).toBe('')
    expect(getImageUrl(undefined)).toBe('')
  })

  it('builds TMDB image URL with provided size', () => {
    expect(getImageUrl('/abc.jpg', 'w780')).toBe('https://image.tmdb.org/t/p/w780/abc.jpg')
  })
})

describe('movies discover filters smoke', () => {
  it('parses extended filters and mirrors them to fetch params', () => {
    const state = parseMoviesDiscoverSearchParams({
      genre: '878',
      year: '2026',
      provider: '8',
      studio: '420',
      rating: '7',
      language: 'en',
      country: 'US',
      runtime: '90-120',
      sort: 'trending',
    })
    const params = discoverStateToFetchParams(state)
    expect(params.genre).toBe('878')
    expect(params.year).toBe('2026')
    expect(params.provider).toBe('8')
    expect(params.studio).toBe('420')
    expect(params.country).toBe('US')
    expect(params.runtime).toBe('90-120')
    expect(params.sort).toBe('trending')
  })

  it('uses current year hype defaults on clean /movies feed', () => {
    const state = parseMoviesDiscoverSearchParams({})
    const { input } = discoverStateToBrowseInput(state, 1)
    expect(input.sort_by).toBe('primary_release_date.desc')
    expect(input.primary_release_date_lte).toBe(`${new Date().getFullYear()}-12-31`)
    expect(input.vote_count_gte).toBe('0')
  })

  it('uses 2026-down release-date-desc defaults for genre-only categories', () => {
    const state = parseMoviesDiscoverSearchParams({ genre: '28' })
    const { input } = discoverStateToBrowseInput(state, 1)
    const today = new Date().toISOString().slice(0, 10)
    expect(input.genre).toBe('28')
    expect(input.sort_by).toBe('primary_release_date.desc')
    expect(input.primary_release_date_gte).toBeUndefined()
    expect(input.primary_release_date_lte).toBe(today)
    expect(input.vote_count_gte).toBe('0')
  })

  it('applies blockbuster vote floor for coming-soon movies discover', () => {
    const state = parseMoviesDiscoverSearchParams({ coming: '2026' })
    expect(state.voteCountGte).toBe(String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN))
    const { input } = discoverStateToBrowseInput(state, 1)
    expect(input.vote_count_gte).toBe(String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN))
    expect(input.sort_by).toBe('primary_release_date.asc')
  })

  it('parses expected month spotlight and maps to release window + fetch params', () => {
    const state = parseMoviesDiscoverSearchParams({ expected: '2026-05' })
    expect(state.expectedYear).toBe(2026)
    expect(state.expectedMonth).toBe(5)
    expect(state.comingYear).toBeUndefined()
    expect(state.year).toBeUndefined()
    expect(state.voteCountGte).toBe(String(COMING_BLOCKBUSTER_MOVIE_VOTE_MIN))
    const params = discoverStateToFetchParams(state)
    expect(params.expected).toBe('2026-05')
    const { input } = discoverStateToBrowseInput(state, 1)
    expect(input.sort_by).toBe('primary_release_date.asc')
    expect(input.primary_release_date_gte).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(input.primary_release_date_lte).toBe('2026-05-31')
  })

  it('prefers expected over coming when both are present', () => {
    const state = parseMoviesDiscoverSearchParams({ expected: '2026-05', coming: '2026' })
    expect(state.expectedYear).toBe(2026)
    expect(state.expectedMonth).toBe(5)
    expect(state.comingYear).toBeUndefined()
  })

  it('accepts month+year as an alternative expected spotlight', () => {
    const state = parseMoviesDiscoverSearchParams({ month: '5', year: '2027' })
    expect(state.expectedYear).toBe(2027)
    expect(state.expectedMonth).toBe(5)
    expect(state.year).toBeUndefined()
  })
})

describe('cartoons discover filters smoke', () => {
  it('forces animation genre in browse input defaults', () => {
    const state = parseCartoonsDiscoverSearchParams({})
    const { input } = discoverCartoonsStateToBrowseInput(state, 1)
    expect(input.genre).toBe('16')
    expect(input.without_genres).toBe('99,10402,10764,10767,10763,10766')
    expect(input.sort_by).toBe('primary_release_date.desc')
  })

  it('keeps user filters and fetch params for cartoons route', () => {
    const state = parseCartoonsDiscoverSearchParams({
      genre: '10751',
      year: '2025',
      studio: '2',
      runtime: '90-120',
      sort: 'trending',
    })
    const params = discoverCartoonsStateToFetchParams(state)
    expect(params.genre).toBe('10751')
    expect(params.year).toBe('2025')
    expect(params.studio).toBe('2')
    expect(params.runtime).toBe('90-120')
    expect(params.sort).toBe('trending')
    expect(params.without_genres).toBe('99,10402,10764,10767,10763,10766')
  })
})

describe('series and tv-shows separation', () => {
  it('series defaults exclude tv-show-only genres', () => {
    const state = parseSeriesDiscoverSearchParams({})
    const { input } = discoverSeriesStateToBrowseInput(state, 1)
    expect(input.without_genres).toBe('16,10764,10767,10763,10766')
  })

  it('tvshows defaults force tv-show-only genres', () => {
    const state = parseTvShowsDiscoverSearchParams({})
    const { input } = discoverTvShowsStateToBrowseInput(state, 1)
    expect(input.genre).toBe('10764|10767|10763|10766')
    expect(input.without_genres).toBe('16')
  })

  it('tvshows sanitizes out scripted-only genre from fetch params', () => {
    const state = parseTvShowsDiscoverSearchParams({ genre: '18', sort: 'trending' })
    const params = discoverTvShowsStateToFetchParams(state)
    expect(params.genre).toBeUndefined()
    expect(params.without_genres).toBe('16')
  })

  it('applies blockbuster vote floor for coming-soon series discover', () => {
    const state = parseSeriesDiscoverSearchParams({ coming: '2026' })
    expect(state.voteCountGte).toBe(String(COMING_BLOCKBUSTER_TV_VOTE_MIN))
    const { input } = discoverSeriesStateToBrowseInput(state, 1)
    expect(input.vote_count_gte).toBe(String(COMING_BLOCKBUSTER_TV_VOTE_MIN))
    expect(input.sort_by).toBe('first_air_date.asc')
  })
})

describe('movies trending quality filters', () => {
  const makeRow = (
    overrides: Partial<{
      id: number
      genre_ids: number[]
      release_date: string
      vote_count: number
    }> = {}
  ) => ({
    id: 1,
    title: 'Sample',
    overview: 'Sample overview',
    poster_path: '/x.jpg',
    backdrop_path: '/b.jpg',
    vote_average: 7.5,
    popularity: 100,
    genre_ids: [28, 53],
    release_date: '2026-01-05',
    vote_count: 250,
    ...overrides,
  })

  it('excludes animation and unreleased/low-signal rows from trending movies', () => {
    expect(isMainstreamTrendingMovie(makeRow({ genre_ids: [] }), '2026-01-10')).toBe(false)
    expect(isMainstreamTrendingMovie(makeRow({ genre_ids: [16, 35] }), '2026-01-10')).toBe(false)
    expect(isMainstreamTrendingMovie(makeRow({ release_date: '2026-02-01' }), '2026-01-10')).toBe(
      false
    )
    expect(isMainstreamTrendingMovie(makeRow({ vote_count: 20 }), '2026-01-10')).toBe(false)
    expect(isMainstreamTrendingMovie(makeRow(), '2026-01-10')).toBe(true)
  })

  it('keeps TMDB order but boosts very fresh releases', () => {
    const rows = [
      makeRow({ id: 1, release_date: '2025-02-01' }),
      makeRow({ id: 2, release_date: '2026-01-05' }),
      makeRow({ id: 3, release_date: '2025-12-20' }),
      makeRow({ id: 4, release_date: '2024-07-10' }),
    ]

    const ranked = applyTrendingRecencyBias(rows, '2026-01-10')
    expect(ranked.map((x) => x.id)).toEqual([2, 1, 3, 4])
  })
})

describe('upcoming / coming-soon shelf order', () => {
  const shelfBase = (overrides: Partial<ShelfItem>): ShelfItem => ({
    id: 0,
    type: 'movie',
    title: 'T',
    posterPath: '/x.jpg',
    overview: '',
    voteAverage: 7,
    releaseDate: new Date(2026, 3, 15),
    popularity: 50,
    genres: [],
    ...overrides,
  })

  it('sorts by release date ascending (soonest first)', () => {
    const june = shelfBase({
      id: 1,
      title: 'June',
      releaseDate: new Date(2026, 5, 1),
      popularity: 999,
    })
    const april = shelfBase({
      id: 2,
      title: 'April',
      releaseDate: new Date(2026, 3, 10),
      popularity: 10,
    })
    const may = shelfBase({
      id: 3,
      title: 'May',
      releaseDate: new Date(2026, 4, 1),
      popularity: 40,
    })
    const sorted = [june, april, may].sort(compareShelfItemsByUpcomingReleaseAsc)
    expect(sorted.map((x) => x.title)).toEqual(['April', 'May', 'June'])
  })
})

describe('getTopMovies2026MosaicPosterUrls resilience', () => {
  const rawMovie = {
    id: 7001,
    title: 'Sample Movie',
    overview: 'Sample overview',
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    release_date: '2026-05-20',
    vote_average: 7.8,
    vote_count: 900,
    popularity: 1200,
    genre_ids: [28, 12],
  }

  const makeDiscoverPage = () => ({
    page: 1,
    total_pages: 1,
    total_results: 1,
    results: [rawMovie],
  })

  beforeEach(() => {
    let discoverFailureConsumed = false
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL) => {
        const url = String(input)
        if (!discoverFailureConsumed && url.includes('/discover/movie')) {
          discoverFailureConsumed = true
          return new Response('Internal Server Error', { status: 500 })
        }

        return new Response(JSON.stringify(makeDiscoverPage()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('continues building mosaic when one discover request returns 500', async () => {
    const posters = await getTopMovies2026MosaicPosterUrls(10)
    expect(posters.length).toBeGreaterThan(0)
    expect(posters[0]).toContain('/w154/')
  })
})

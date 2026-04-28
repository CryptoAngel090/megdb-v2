import {
  formatDiscoverLanguageCode,
  formatDiscoverRegionCode,
  formatDiscoverSortHuman,
  MOVIE_RUNTIME_BUCKET_LABELS,
} from '@/lib/discoverCopyHelpers'
import { buildCanonicalPath } from '@/lib/canonicalQuery'
import { movieGenrePathById } from '@/lib/movieGenreRoute'
import type {
  MoviesDiscoverState,
  TmdbGenreListItem,
  TmdbStudioListItem,
  WatchProviderListItem,
} from '@/lib/tmdb'
import { moviesDiscoverActiveFilterKeys } from '@/lib/tmdb'

type MoviesDiscoverCopyContext = {
  providers?: WatchProviderListItem[]
  studios?: TmdbStudioListItem[]
}

function providerName(
  state: MoviesDiscoverState,
  ctx?: MoviesDiscoverCopyContext
): string | undefined {
  if (!state.provider || !ctx?.providers?.length) return undefined
  return ctx.providers.find((p) => String(p.provider_id) === state.provider)?.provider_name
}

function studioName(
  state: MoviesDiscoverState,
  ctx?: MoviesDiscoverCopyContext
): string | undefined {
  if (!state.studio || !ctx?.studios?.length) return undefined
  return ctx.studios.find((s) => String(s.id) === state.studio)?.name
}

function movieRuntimeLabel(runtime?: string): string | undefined {
  if (!runtime) return undefined
  return MOVIE_RUNTIME_BUCKET_LABELS[runtime] ?? runtime
}

function expectedMonthLabel(state: MoviesDiscoverState): string | undefined {
  if (state.expectedYear == null || state.expectedMonth == null) return undefined
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(state.expectedYear, state.expectedMonth - 1, 1))
  )
}

/** Short hero line under “Movies” (on-page only; meta uses `getMoviesDiscoverDescription`). */
export function getMoviesDiscoverHeroLead(
  state: MoviesDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: MoviesDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `${g.name} films on TMDB in ${y}. Refine with year, rating, language or provider below.`
    }
  }

  if (keys.length > 1) {
    return 'Several filters are on—results are narrowed. Clear one or reset to browse more titles.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `Releases credited to ${state.year} on TMDB. Use sort and extra filters to fine-tune.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming through ${state.comingYear} (TMDB release dates). Pair with genre or provider if you like.`
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const label = expectedMonthLabel(state)
    if (label) {
      return `Theatrical-style releases in ${label} on TMDB (soonest first). Add genre or provider if you like.`
    }
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `Movies available on ${name} in the US (TMDB watch providers). Add genre, year or runtime to narrow results.`
    }
    return 'Filtered by streaming provider. Layer genre, year or runtime to refine your list.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `Titles linked to ${name} on TMDB. Combine with provider, language or rating for a tighter list.`
    }
    return 'Filtered by studio. Add provider, genre or year to fine-tune discovery.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Audience-rated ${state.rating}+ on TMDB. Pair with genre, provider or runtime for better matches.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language films on TMDB. Add provider, genre or year to sharpen results.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Movies with origin in ${label} on TMDB. Refine with language, provider or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = movieRuntimeLabel(state.runtime)
    if (label) {
      return `${label} runtime on TMDB. Add genre, provider or rating to narrow.`
    }
  }

  if (keys.length === 0) {
    return `Browse TMDB’s catalog in ${y}: filter by genre, year, rating, language and streaming service—Netflix, Disney+, Prime Video, Max, Apple TV+ and more.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending right now on TMDB. Add genre, year or provider filters to narrow the list.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated picks by audience score on TMDB. Filter further with genre, year or platform.'
    }
    return `Sorted by ${formatDiscoverSortHuman(state.sortParam)}. Add genre, provider or year filters if you like.`
  }

  return 'TMDB-powered browse: use filters and sort below to find your next movie.'
}

/** SEO / meta description for `/movies` (concise; hero uses `getMoviesDiscoverHeroLead`). */
export function getMoviesDiscoverDescription(
  state: MoviesDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: MoviesDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `Discover highly rated ${g.name} films worth watching in ${y}. Browse TMDB-powered listings, ratings, and release information.`
    }
  }

  if (keys.length > 1) {
    return 'Browse movies by genre, year, rating, language and streaming service.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `Theatrical and streaming releases credited to ${state.year} on TMDB.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming movies through the end of ${state.comingYear} — TMDB release dates.`
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const label = expectedMonthLabel(state)
    if (label) {
      return `Movies with primary release dates in ${label} — TMDB, sorted soonest first.`
    }
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `Movies available on ${name} in the US — TMDB watch-provider data with filters for genre, year, rating and runtime.`
    }
    return 'Browse movies filtered by streaming provider — TMDB-powered listings with genre, year and runtime controls.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `Movies associated with ${name} on TMDB — explore titles, then narrow by provider, genre or rating.`
    }
    return 'Discover movies by production company on TMDB — refine with streaming, genre and year filters.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Movies rated ${state.rating}+ by audiences on TMDB — strong vote floors with optional genre, provider and runtime filters.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language movies on TMDB — pair with provider, country or runtime to find your next watch.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Movies with origin in ${label} on TMDB — filter further by language, streaming service and rating.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = movieRuntimeLabel(state.runtime)
    if (label) {
      return `Movies in the ${label} runtime band on TMDB — combine with genre, provider or rating.`
    }
  }

  if (keys.length === 0) {
    return `Discover the best movies to watch online in ${y}. Browse 500,000+ titles by genre, year, rating, language and platform — Netflix, Disney+, Prime Video, Max, Apple TV+ and more.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending movies today: what audiences are watching worldwide. Updated from TMDB — explore titles, then narrow by genre, year, rating, language or streaming service.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated movies by audience score: acclaimed films with strong vote counts on TMDB. Filter by genre, year, platform or language to find your next watch.'
    }
    return `Movies on TMDB sorted by ${formatDiscoverSortHuman(state.sortParam)} — add filters to personalize results.`
  }

  return 'Discover popular movies to watch online. Browse titles by genre, year, rating, language and platform — powered by TMDB.'
}

/** Title aligned with `app/movies/page.tsx` `generateMetadata`. */
export function getMoviesDiscoverTitle(
  state: MoviesDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: MoviesDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) return `Best ${g.name} Movies ${y}`
    return `Movies by genre (${y})`
  }

  if (keys.length > 1) return 'Browse movies'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `Movies from ${state.year}`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Coming in ${state.comingYear}`
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
      new Date(Date.UTC(state.expectedYear, state.expectedMonth - 1, 1))
    )
    return `Expected in ${monthTitle} ${state.expectedYear}`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) return `Movies on ${name} (${y})`
    return `Movies by streaming provider (${y})`
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) return `${name} movies (${y})`
    return `Movies by studio (${y})`
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Rated ${state.rating}+ movies (${y})`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label} movies (${y})`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Movies from ${label} (${y})`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = movieRuntimeLabel(state.runtime)
    if (label) return `${label} movies (${y})`
    return `Movies by runtime (${y})`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') return `Trending movies (${y})`
    if (state.sortParam === 'top') return `Top-rated movies (${y})`
    return `Movies — ${formatDiscoverSortHuman(state.sortParam)} (${y})`
  }

  return `Where to Watch Movies Online — Netflix, Prime, Disney+ (${y})`
}

/** Canonical path + query aligned with `/movies` metadata. */
export function getMoviesDiscoverCanonicalPath(
  state: MoviesDiscoverState,
  _genres: TmdbGenreListItem[],
  _ctx?: MoviesDiscoverCopyContext
): string {
  void _genres
  void _ctx
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly && state.genre) {
    const genrePath = movieGenrePathById(state.genre)
    if (genrePath) return genrePath
    return buildCanonicalPath('/movies', { genre: state.genre })
  }

  if (keys.length > 1) return '/movies'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return buildCanonicalPath('/movies', { year: state.year })
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return buildCanonicalPath('/movies', { coming: String(state.comingYear) })
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const expectedQs = `${state.expectedYear}-${String(state.expectedMonth).padStart(2, '0')}`
    return buildCanonicalPath('/movies', { expected: expectedQs })
  }

  if (keys.length === 1) {
    if (keys[0] === 'provider' && state.provider) {
      return buildCanonicalPath('/movies', { provider: state.provider })
    }
    if (keys[0] === 'studio' && state.studio) {
      return buildCanonicalPath('/movies', { studio: state.studio })
    }
    if (keys[0] === 'rating' && state.rating) {
      return buildCanonicalPath('/movies', { rating: state.rating })
    }
    if (keys[0] === 'language' && state.language) {
      return buildCanonicalPath('/movies', { language: state.language })
    }
    if (keys[0] === 'country' && state.country) {
      return buildCanonicalPath('/movies', { country: state.country })
    }
    if (keys[0] === 'runtime' && state.runtime) {
      return buildCanonicalPath('/movies', { runtime: state.runtime })
    }
    if (keys[0] === 'sort') {
      return buildCanonicalPath('/movies', { sort: state.sortParam })
    }
  }

  return '/movies'
}

/** Keywords on broad discover views (narrow facet pages omit keyword meta). */
export function getMoviesDiscoverKeywords(
  state: MoviesDiscoverState,
  genres: TmdbGenreListItem[]
): string[] | undefined {
  const keys = moviesDiscoverActiveFilterKeys(state)
  if (keys.length > 1) return undefined

  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  if (genreOnly && genres.find((x) => String(x.id) === state.genre)) return undefined

  if (state.year && keys.length === 1 && keys[0] === 'year') return undefined
  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') return undefined
  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    return undefined
  }

  const narrowSingleKeys: readonly string[] = [
    'provider',
    'studio',
    'rating',
    'language',
    'country',
    'runtime',
  ]
  const only = keys.length === 1 ? keys[0] : undefined
  if (only != null && narrowSingleKeys.includes(only)) return undefined

  const y = new Date().getFullYear()
  return [
    `best movies ${y}`,
    'movies to watch online',
    'best movies to stream',
    `top movies ${y}`,
    `movies streaming ${y}`,
    'where to watch movies',
    `best films ${y}`,
  ]
}

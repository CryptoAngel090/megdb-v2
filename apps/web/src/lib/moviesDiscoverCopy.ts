import type { MoviesDiscoverState, TmdbGenreListItem } from '@/lib/tmdb'
import { moviesDiscoverActiveFilterKeys } from '@/lib/tmdb'

/** Short hero line under “Movies” (on-page only; meta uses `getMoviesDiscoverDescription`). */
export function getMoviesDiscoverHeroLead(
  state: MoviesDiscoverState,
  genres: TmdbGenreListItem[]
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
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(Date.UTC(state.expectedYear, state.expectedMonth - 1, 1))
    )
    return `Theatrical-style releases in ${label} on TMDB (soonest first). Add genre or provider if you like.`
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
  }

  return 'TMDB-powered browse: use filters and sort below to find your next movie.'
}

/** SEO / meta description for `/movies` (concise; hero uses `getMoviesDiscoverHeroLead`). */
export function getMoviesDiscoverDescription(
  state: MoviesDiscoverState,
  genres: TmdbGenreListItem[]
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
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(Date.UTC(state.expectedYear, state.expectedMonth - 1, 1))
    )
    return `Movies with primary release dates in ${label} — TMDB, sorted soonest first.`
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
  }

  return 'Discover popular movies to watch online. Browse titles by genre, year, rating, language and platform — powered by TMDB.'
}

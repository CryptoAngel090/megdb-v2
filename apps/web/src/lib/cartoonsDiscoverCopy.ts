import {
  formatDiscoverLanguageCode,
  formatDiscoverRegionCode,
  formatDiscoverSortHuman,
  MOVIE_RUNTIME_BUCKET_LABELS,
} from '@/lib/discoverCopyHelpers'
import { buildCanonicalPath } from '@/lib/canonicalQuery'
import type {
  CartoonsDiscoverState,
  TmdbGenreListItem,
  TmdbStudioListItem,
  WatchProviderListItem,
} from '@/lib/tmdb'
import { moviesDiscoverActiveFilterKeys } from '@/lib/tmdb'

type CartoonsDiscoverCopyContext = {
  providers?: WatchProviderListItem[]
  studios?: TmdbStudioListItem[]
}

function providerName(
  state: CartoonsDiscoverState,
  ctx?: CartoonsDiscoverCopyContext
): string | undefined {
  if (!state.provider || !ctx?.providers?.length) return undefined
  return ctx.providers.find((p) => String(p.provider_id) === state.provider)?.provider_name
}

function studioName(
  state: CartoonsDiscoverState,
  ctx?: CartoonsDiscoverCopyContext
): string | undefined {
  if (!state.studio || !ctx?.studios?.length) return undefined
  return ctx.studios.find((s) => String(s.id) === state.studio)?.name
}

function cartoonRuntimeLabel(runtime?: string): string | undefined {
  if (!runtime) return undefined
  return MOVIE_RUNTIME_BUCKET_LABELS[runtime] ?? runtime
}

function expectedMonthLabel(state: CartoonsDiscoverState): string | undefined {
  if (state.expectedYear == null || state.expectedMonth == null) return undefined
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(state.expectedYear, state.expectedMonth - 1, 1))
  )
}

export function getCartoonsDiscoverHeroLead(
  state: CartoonsDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: CartoonsDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `${g.name} animation picks in ${y}. Refine by year, rating, language, provider, or studio.`
    }
  }

  if (keys.length > 1) {
    return 'Several filters are active. Clear one or reset to explore more animated titles.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `Animated releases credited to ${state.year}. Change sort or add filters to narrow results.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming animation through ${state.comingYear} on TMDB. Pair with genre, provider or runtime.`
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const label = expectedMonthLabel(state)
    if (label) {
      return `Animated releases in ${label} on TMDB (soonest first). Add genre or provider if you like.`
    }
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `Animation available on ${name} in the US (TMDB). Add genre, year or runtime to narrow results.`
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
    return `Audience-rated ${state.rating}+ animation on TMDB. Pair with genre, provider or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language animation on TMDB. Add provider, genre or year to sharpen results.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Animation with origin in ${label} on TMDB. Refine with language, provider or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = cartoonRuntimeLabel(state.runtime)
    if (label) {
      return `${label} typical runtime on TMDB. Add genre, provider or rating to narrow.`
    }
  }

  if (keys.length === 0) {
    return `Browse animation in ${y}: starts from 2026 hype picks, then 2025 and older. Filter by studio, runtime, language, and platform.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending animation now. Add genre, year, or platform filters to focus your list.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated animated titles by audience score. Filter by year, language, and runtime.'
    }
    return `Sorted by ${formatDiscoverSortHuman(state.sortParam)}. Add genre, provider or year if you like.`
  }

  return 'Animation discovery powered by TMDB. Use filters and sort to find your next cartoon.'
}

export function getCartoonsDiscoverDescription(
  state: CartoonsDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: CartoonsDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `Discover popular ${g.name} animation in ${y}. Browse cartoon titles with ratings, release years, runtime and streaming filters.`
    }
  }

  if (keys.length > 1) {
    return 'Browse animated titles by genre, year, rating, language, runtime and streaming provider.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `Animated movies credited to ${state.year}. Explore by popularity, rating, and streaming service.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming animated movies through the end of ${state.comingYear} — TMDB release dates.`
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const label = expectedMonthLabel(state)
    if (label) {
      return `Animated movies with primary release dates in ${label} — TMDB, sorted soonest first.`
    }
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `Animation and family films available on ${name} in the US — TMDB watch-provider data with genre, year and runtime filters.`
    }
    return 'Browse cartoons filtered by streaming provider — TMDB-powered listings with genre, year and runtime controls.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `Animated titles associated with ${name} on TMDB — explore, then narrow by provider, genre or rating.`
    }
    return 'Discover animation by studio on TMDB — refine with streaming, genre and year filters.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Animated movies rated ${state.rating}+ on TMDB — optional genre, provider and runtime filters.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language animation on TMDB — pair with provider, country or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Animation with origin in ${label} on TMDB — filter further by language, streaming service and rating.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = cartoonRuntimeLabel(state.runtime)
    if (label) {
      return `Animated movies in the ${label} runtime band on TMDB — combine with genre, provider or rating.`
    }
  }

  if (keys.length === 0) {
    return `Discover the best cartoons and animated movies to watch online in ${y}. Starts with 2026 hype picks, then older titles, with filters for genre, studio, runtime and platform.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending animated titles worldwide. Updated from TMDB, with filters for year, rating, language and platform.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated animation by audience score and vote count. Explore cartoons by year, runtime and provider.'
    }
    return `Animation on TMDB sorted by ${formatDiscoverSortHuman(state.sortParam)} — add filters to personalize results.`
  }

  return 'Discover animated titles online. Filter cartoons by genre, year, rating, language, runtime and platform.'
}

/** Title string aligned with `app/cartoons/page.tsx` `generateMetadata`. */
export function getCartoonsDiscoverTitle(
  state: CartoonsDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: CartoonsDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) return `Best ${g.name} Cartoons ${y}`
    return `Cartoons by genre (${y})`
  }

  if (keys.length > 1) return 'Browse cartoons'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `Cartoons from ${state.year}`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Cartoons coming in ${state.comingYear}`
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
    return `Animated films expected in ${monthTitle} ${state.expectedYear}`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) return `Cartoons on ${name} (${y})`
    return `Cartoons by streaming provider (${y})`
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) return `${name} animation (${y})`
    return `Cartoons by studio (${y})`
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Rated ${state.rating}+ cartoons (${y})`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label} animation (${y})`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Animation from ${label} (${y})`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = cartoonRuntimeLabel(state.runtime)
    if (label) return `${label} cartoons (${y})`
    return `Cartoons by runtime (${y})`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') return `Trending animation (${y})`
    if (state.sortParam === 'top') return `Top-rated animation (${y})`
    return `Animation — ${formatDiscoverSortHuman(state.sortParam)} (${y})`
  }

  return `Best Cartoons and Animated Movies to Watch (${y})`
}

/** Canonical path + query aligned with `generateMetadata` for `/cartoons`. */
export function getCartoonsDiscoverCanonicalPath(
  state: CartoonsDiscoverState,
  _genres: TmdbGenreListItem[],
  _ctx?: CartoonsDiscoverCopyContext
): string {
  void _genres
  void _ctx
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly && state.genre) {
    return buildCanonicalPath('/cartoons', { genre: state.genre })
  }

  if (keys.length > 1) return '/cartoons'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return buildCanonicalPath('/cartoons', { year: state.year })
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return buildCanonicalPath('/cartoons', { coming: String(state.comingYear) })
  }

  if (
    state.expectedYear != null &&
    state.expectedMonth != null &&
    keys.length === 1 &&
    keys[0] === 'expected'
  ) {
    const expectedQs = `${state.expectedYear}-${String(state.expectedMonth).padStart(2, '0')}`
    return buildCanonicalPath('/cartoons', { expected: expectedQs })
  }

  if (keys.length === 1) {
    if (keys[0] === 'provider' && state.provider) {
      return buildCanonicalPath('/cartoons', { provider: state.provider })
    }
    if (keys[0] === 'studio' && state.studio) {
      return buildCanonicalPath('/cartoons', { studio: state.studio })
    }
    if (keys[0] === 'rating' && state.rating) {
      return buildCanonicalPath('/cartoons', { rating: state.rating })
    }
    if (keys[0] === 'language' && state.language) {
      return buildCanonicalPath('/cartoons', { language: state.language })
    }
    if (keys[0] === 'country' && state.country) {
      return buildCanonicalPath('/cartoons', { country: state.country })
    }
    if (keys[0] === 'runtime' && state.runtime) {
      return buildCanonicalPath('/cartoons', { runtime: state.runtime })
    }
    if (keys[0] === 'sort') {
      return buildCanonicalPath('/cartoons', { sort: state.sortParam })
    }
  }

  return '/cartoons'
}

/** Keyword meta for broad `/cartoons` discover views only. */
export function getCartoonsDiscoverKeywords(
  state: CartoonsDiscoverState,
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
    `best cartoons ${y}`,
    'animated movies to watch online',
    'best animation streaming',
    `top animation ${y}`,
    'family animation picks',
    'where to watch cartoons',
  ]
}

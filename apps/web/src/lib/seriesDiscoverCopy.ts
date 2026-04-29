import {
  EPISODE_RUNTIME_BUCKET_LABELS,
  formatDiscoverLanguageCode,
  formatDiscoverRegionCode,
  formatDiscoverSortHuman,
} from '@/lib/discoverCopyHelpers'
import { buildCanonicalPath } from '@/lib/canonicalQuery'
import type {
  SeriesDiscoverState,
  TmdbGenreListItem,
  TmdbStudioListItem,
  WatchProviderListItem,
} from '@/lib/tmdb'
import { seriesDiscoverActiveFilterKeys } from '@/lib/tmdb'

/** Optional lists to resolve provider/studio names in titles, hero, and meta. */
type SeriesDiscoverCopyContext = {
  providers?: WatchProviderListItem[]
  studios?: TmdbStudioListItem[]
}

function providerName(
  state: SeriesDiscoverState,
  ctx?: SeriesDiscoverCopyContext
): string | undefined {
  if (!state.provider || !ctx?.providers?.length) return undefined
  return ctx.providers.find((p) => String(p.provider_id) === state.provider)?.provider_name
}

function studioName(
  state: SeriesDiscoverState,
  ctx?: SeriesDiscoverCopyContext
): string | undefined {
  if (!state.studio || !ctx?.studios?.length) return undefined
  return ctx.studios.find((s) => String(s.id) === state.studio)?.name
}

function runtimeLabel(runtime?: string): string | undefined {
  if (!runtime) return undefined
  return EPISODE_RUNTIME_BUCKET_LABELS[runtime] ?? runtime
}

/** Short hero line under “Series” (on-page only; meta uses `getSeriesDiscoverDescription`). */
export function getSeriesDiscoverHeroLead(
  state: SeriesDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: SeriesDiscoverCopyContext
): string {
  const keys = seriesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `${g.name} series on TMDB in ${y}. Refine with year, rating, episode runtime, language or provider below.`
    }
  }

  if (keys.length > 1) {
    return 'Several filters are on—results are narrowed. Clear one or reset to browse more series.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `First-air or credited-to-${state.year} listings on TMDB. Use sort and extra filters to fine-tune.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming through ${state.comingYear} (TMDB release dates). Pair with genre, provider or episode runtime if you like.`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `Series available on ${name} in the US (TMDB watch providers). Add genre, year or runtime to narrow results.`
    }
    return 'Filtered by streaming provider. Layer genre, year or episode runtime to refine your list.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `Shows linked to ${name} on TMDB. Combine with provider, language or rating for a tighter list.`
    }
    return 'Filtered by network or studio. Add provider, genre or runtime to fine-tune discovery.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Audience-rated ${state.rating}+ on TMDB. Pair with genre, provider or episode length for better matches.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language series on TMDB. Add provider, genre or year to sharpen results.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `Series with origin in ${label} on TMDB. Refine with language, provider or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = runtimeLabel(state.runtime)
    if (label) {
      return `${label} typical episode length on TMDB. Add genre, provider or rating to narrow.`
    }
  }

  if (keys.length === 0) {
    return `Browse hype-ranked series on TMDB: ${y} first, then earlier seasons. Filter by genre, year, rating, episode runtime, language and streaming service.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending TV series on TMDB. Add genre, year or provider filters to narrow the list.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated series by audience score on TMDB. Filter further with genre, year or platform.'
    }
    return `Sorted by ${formatDiscoverSortHuman(state.sortParam)}. Add genre, provider or year filters if you like.`
  }

  return 'TMDB-powered browse: use filters and sort below to find your next series.'
}

/** Meta / JSON-LD description aligned with `app/series/page.tsx` `generateMetadata`. */
export function getSeriesDiscoverDescription(
  state: SeriesDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: SeriesDiscoverCopyContext
): string {
  const keys = seriesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `Discover highly rated ${g.name} TV series worth watching in ${y}. Browse TMDB-powered listings, ratings, and first-air information.`
    }
  }

  if (keys.length > 1) {
    return 'Browse TV series by genre, year, rating, language, episode runtime and streaming service.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV series first-air or credited to ${state.year} on TMDB.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming TV series through the end of ${state.comingYear} — TMDB release dates.`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `TV series available on ${name} in the US — TMDB watch-provider data with filters for genre, year, rating and episode runtime.`
    }
    return 'Browse TV series filtered by streaming provider — TMDB-powered listings with genre, year and runtime controls.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `TV series associated with ${name} on TMDB — explore titles, then narrow by provider, genre or rating.`
    }
    return 'Discover TV series by production company or network on TMDB — refine with streaming, genre and year filters.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `TV series rated ${state.rating}+ by audiences on TMDB — strong vote floors with optional genre, provider and runtime filters.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language TV series on TMDB — pair with provider, country or episode runtime to find your next show.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `TV series with origin in ${label} on TMDB — filter further by language, streaming service and rating.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = runtimeLabel(state.runtime)
    if (label) {
      return `TV series whose typical episode length is ${label} on TMDB — combine with genre, provider or rating.`
    }
  }

  if (keys.length === 0) {
    return `Discover the best TV series to watch online in ${y}. Browse hype-first listings by genre, year, rating, language and platform — Netflix, Disney+, Prime Video, Max, Apple TV+ and more.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending TV series today: what audiences are following worldwide. Updated from TMDB — explore titles, then narrow by genre, year, rating, language or streaming service.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated TV series by audience score: acclaimed shows with strong vote counts on TMDB. Filter by genre, year, platform or language to find your next binge.'
    }
    return `TV series on TMDB sorted by ${formatDiscoverSortHuman(state.sortParam)} — add filters to personalize results.`
  }

  return 'Discover popular TV series to watch online. Browse shows by genre, year, rating, language and platform — powered by TMDB.'
}

export function getSeriesDiscoverTitle(
  state: SeriesDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: SeriesDiscoverCopyContext
): string {
  const keys = seriesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()
  const suffix = state.sortParam === 'trending' ? 'Trending' : 'TV Series'
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) return `Best ${g.name} TV Series ${y}`
    return `TV series by genre (${y})`
  }

  if (keys.length > 1) return 'Browse TV series'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV series from ${state.year}`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `TV series coming in ${state.comingYear}`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) return `TV series on ${name} (${y})`
    return `TV series by streaming provider (${y})`
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) return `${name} TV series (${y})`
    return `TV series by studio (${y})`
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Rated ${state.rating}+ TV series (${y})`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label} TV series (${y})`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `TV series from ${label} (${y})`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = runtimeLabel(state.runtime)
    if (label) return `${label} episodes — TV series (${y})`
    return `TV series by episode length (${y})`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') return `Trending TV series (${y})`
    if (state.sortParam === 'top') return `Top-rated TV series (${y})`
    return `TV series — ${formatDiscoverSortHuman(state.sortParam)} (${y})`
  }

  return `Best ${suffix} to Watch (${y})`
}

/** Canonical path + query aligned with `/series` metadata and JSON-LD `url`. */
export function getSeriesDiscoverCanonicalPath(
  state: SeriesDiscoverState,
  _genres: TmdbGenreListItem[],
  _ctx?: SeriesDiscoverCopyContext
): string {
  void _genres
  void _ctx
  const keys = seriesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly && state.genre) {
    return buildCanonicalPath('/series', { genre: state.genre })
  }

  if (keys.length > 1) return '/series'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return buildCanonicalPath('/series', { year: state.year })
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return buildCanonicalPath('/series', { coming: String(state.comingYear) })
  }

  if (keys.length === 1) {
    if (keys[0] === 'provider' && state.provider) {
      return buildCanonicalPath('/series', { provider: state.provider })
    }
    if (keys[0] === 'studio' && state.studio) {
      return buildCanonicalPath('/series', { studio: state.studio })
    }
    if (keys[0] === 'rating' && state.rating) {
      return buildCanonicalPath('/series', { rating: state.rating })
    }
    if (keys[0] === 'language' && state.language) {
      return buildCanonicalPath('/series', { language: state.language })
    }
    if (keys[0] === 'country' && state.country) {
      return buildCanonicalPath('/series', { country: state.country })
    }
    if (keys[0] === 'runtime' && state.runtime) {
      return buildCanonicalPath('/series', { runtime: state.runtime })
    }
    if (keys[0] === 'sort') {
      return buildCanonicalPath('/series', { sort: state.sortParam })
    }
  }

  return '/series'
}

/** Keywords on the main discover landing and broad sort views (matches `/movies` pattern). */
export function getSeriesDiscoverKeywords(
  state: SeriesDiscoverState,
  genres: TmdbGenreListItem[]
): string[] | undefined {
  const keys = seriesDiscoverActiveFilterKeys(state)
  if (keys.length > 1) return undefined

  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'
  if (genreOnly && genres.find((x) => String(x.id) === state.genre)) return undefined

  if (state.year && keys.length === 1 && keys[0] === 'year') return undefined
  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') return undefined

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
    `best tv series ${y}`,
    'tv series to watch online',
    'best series streaming',
    `top tv series ${y}`,
    'where to watch tv series',
    `binge-worthy series ${y}`,
  ]
}

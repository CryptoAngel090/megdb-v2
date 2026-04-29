import { buildCanonicalPath } from '@/lib/canonicalQuery'
import {
  EPISODE_RUNTIME_BUCKET_LABELS,
  formatDiscoverLanguageCode,
  formatDiscoverRegionCode,
  formatDiscoverSortHuman,
} from '@/lib/discoverCopyHelpers'
import type {
  TmdbGenreListItem,
  TmdbStudioListItem,
  TvShowsDiscoverState,
  WatchProviderListItem,
} from '@/lib/tmdb'
import { moviesDiscoverActiveFilterKeys } from '@/lib/tmdb'

type TvShowsDiscoverCopyContext = {
  providers?: WatchProviderListItem[]
  studios?: TmdbStudioListItem[]
}

function providerName(
  state: TvShowsDiscoverState,
  ctx?: TvShowsDiscoverCopyContext
): string | undefined {
  if (!state.provider || !ctx?.providers?.length) return undefined
  return ctx.providers.find((p) => String(p.provider_id) === state.provider)?.provider_name
}

function studioName(
  state: TvShowsDiscoverState,
  ctx?: TvShowsDiscoverCopyContext
): string | undefined {
  if (!state.studio || !ctx?.studios?.length) return undefined
  return ctx.studios.find((s) => String(s.id) === state.studio)?.name
}

function runtimeLabel(runtime?: string): string | undefined {
  if (!runtime) return undefined
  return EPISODE_RUNTIME_BUCKET_LABELS[runtime] ?? runtime
}

export function getTvShowsDiscoverHeroLead(
  state: TvShowsDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: TvShowsDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `${g.name} TV shows on TMDB in ${y}. Refine by year, rating, episode runtime, language or provider.`
    }
  }

  if (keys.length > 1) {
    return 'Several filters are active. Clear one or reset to browse more TV titles.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV releases credited to ${state.year} on TMDB. Use filters and sort to fine-tune results.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `Upcoming seasons and premieres through ${state.comingYear} on TMDB. Add genre, provider or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `TV shows available on ${name} in the US (TMDB). Layer genre, year or episode runtime to narrow.`
    }
    return 'Filtered by streaming provider. Add genre, year or runtime to refine your list.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `Titles linked to ${name} on TMDB. Combine with provider, language or rating for a tighter list.`
    }
    return 'Filtered by network or studio. Add provider, genre or runtime to fine-tune discovery.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Audience-rated ${state.rating}+ on TMDB. Pair with genre, provider or episode length for better matches.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language TV shows on TMDB. Add provider, genre or year to sharpen results.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `TV shows with origin in ${label} on TMDB. Refine with language, provider or runtime.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = runtimeLabel(state.runtime)
    if (label) {
      return `${label} typical episode length on TMDB. Add genre, provider or rating to narrow.`
    }
  }

  if (keys.length === 0) {
    return `Browse TV shows on TMDB in ${y}: hype-first ordering, then earlier seasons. Filter by genre, network, episode runtime, language and platform.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending TV right now on TMDB. Narrow by genre, year, platform or runtime.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated TV by audience score on TMDB. Filter to match your taste.'
    }
    return `Sorted by ${formatDiscoverSortHuman(state.sortParam)}. Add genre, provider or year if you like.`
  }

  return 'TV discovery powered by TMDB. Use filters and sort to find your next show.'
}

export function getTvShowsDiscoverDescription(
  state: TvShowsDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: TvShowsDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) {
      return `Discover popular ${g.name} TV shows in ${y}. Browse titles with ratings, episode runtime, language and streaming filters — TMDB-powered.`
    }
  }

  if (keys.length > 1) {
    return 'Browse TV shows by genre, year, rating, language, episode runtime and streaming provider.'
  }

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV shows credited to ${state.year} on TMDB. Explore by popularity, rating, language and platform.`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `TV shows with upcoming seasons or premieres through ${state.comingYear} on TMDB — filter by genre, runtime and platform.`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) {
      return `TV shows available on ${name} in the US — TMDB watch-provider data with filters for genre, year, rating and episode runtime.`
    }
    return 'Browse TV shows filtered by streaming provider — TMDB-powered listings with genre, year and runtime controls.'
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) {
      return `TV shows associated with ${name} on TMDB — explore titles, then narrow by provider, genre or rating.`
    }
    return 'Discover TV shows by network or production company on TMDB — refine with streaming, genre and year filters.'
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `TV shows rated ${state.rating}+ by audiences on TMDB — strong vote floors with optional genre, provider and runtime filters.`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label}-language TV shows on TMDB — pair with provider, country or episode runtime to find your next watch.`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `TV shows with origin in ${label} on TMDB — filter further by language, streaming service and rating.`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = runtimeLabel(state.runtime)
    if (label) {
      return `TV shows whose typical episode length is ${label} on TMDB — combine with genre, provider or rating.`
    }
  }

  if (keys.length === 0) {
    return `Discover TV shows to watch online in ${y}. Hype-first picks, then deeper catalog — filters for genre, network, episode runtime and platform.`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') {
      return 'Trending TV shows worldwide on TMDB — explore titles, then narrow by genre, year, rating, language or streaming service.'
    }
    if (state.sortParam === 'top') {
      return 'Top-rated TV shows by audience score and vote count on TMDB — filter by genre, year, platform or language.'
    }
    return `TV shows on TMDB sorted by ${formatDiscoverSortHuman(state.sortParam)} — add filters to personalize results.`
  }

  return 'Discover TV shows online. Filter by genre, year, rating, language, episode runtime and streaming platform — powered by TMDB.'
}

export function getTvShowsDiscoverTitle(
  state: TvShowsDiscoverState,
  genres: TmdbGenreListItem[],
  ctx?: TvShowsDiscoverCopyContext
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly) {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g) return `Best ${g.name} TV Shows ${y}`
    return `TV shows by genre (${y})`
  }

  if (keys.length > 1) return 'Browse TV shows'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV Shows from ${state.year}`
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return `TV shows coming in ${state.comingYear}`
  }

  if (keys.length === 1 && keys[0] === 'provider') {
    const name = providerName(state, ctx)
    if (name) return `TV shows on ${name} (${y})`
    return `TV shows by streaming provider (${y})`
  }

  if (keys.length === 1 && keys[0] === 'studio') {
    const name = studioName(state, ctx)
    if (name) return `${name} TV shows (${y})`
    return `TV shows by studio (${y})`
  }

  if (keys.length === 1 && keys[0] === 'rating' && state.rating) {
    return `Rated ${state.rating}+ TV shows (${y})`
  }

  if (keys.length === 1 && keys[0] === 'language' && state.language) {
    const label = formatDiscoverLanguageCode(state.language)
    return `${label} TV shows (${y})`
  }

  if (keys.length === 1 && keys[0] === 'country' && state.country) {
    const label = formatDiscoverRegionCode(state.country)
    return `TV shows from ${label} (${y})`
  }

  if (keys.length === 1 && keys[0] === 'runtime' && state.runtime) {
    const label = runtimeLabel(state.runtime)
    if (label) return `${label} episodes — TV shows (${y})`
    return `TV shows by episode length (${y})`
  }

  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending') return `Trending TV shows (${y})`
    if (state.sortParam === 'top') return `Top-rated TV shows (${y})`
    return `TV shows — ${formatDiscoverSortHuman(state.sortParam)} (${y})`
  }

  return `Best TV Shows to Watch (${y})`
}

export function getTvShowsDiscoverCanonicalPath(
  state: TvShowsDiscoverState,
  _genres: TmdbGenreListItem[],
  _ctx?: TvShowsDiscoverCopyContext
): string {
  void _genres
  void _ctx
  const keys = moviesDiscoverActiveFilterKeys(state)
  const genreOnly = state.genre && keys.length === 1 && keys[0] === 'genre'

  if (genreOnly && state.genre) {
    return buildCanonicalPath('/tvshows', { genre: state.genre })
  }

  if (keys.length > 1) return '/tvshows'

  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return buildCanonicalPath('/tvshows', { year: state.year })
  }

  if (state.comingYear != null && keys.length === 1 && keys[0] === 'coming') {
    return buildCanonicalPath('/tvshows', { coming: String(state.comingYear) })
  }

  if (keys.length === 1) {
    if (keys[0] === 'provider' && state.provider) {
      return buildCanonicalPath('/tvshows', { provider: state.provider })
    }
    if (keys[0] === 'studio' && state.studio) {
      return buildCanonicalPath('/tvshows', { studio: state.studio })
    }
    if (keys[0] === 'rating' && state.rating) {
      return buildCanonicalPath('/tvshows', { rating: state.rating })
    }
    if (keys[0] === 'language' && state.language) {
      return buildCanonicalPath('/tvshows', { language: state.language })
    }
    if (keys[0] === 'country' && state.country) {
      return buildCanonicalPath('/tvshows', { country: state.country })
    }
    if (keys[0] === 'runtime' && state.runtime) {
      return buildCanonicalPath('/tvshows', { runtime: state.runtime })
    }
    if (keys[0] === 'sort') {
      return buildCanonicalPath('/tvshows', { sort: state.sortParam })
    }
  }

  return '/tvshows'
}

export function getTvShowsDiscoverKeywords(
  state: TvShowsDiscoverState,
  genres: TmdbGenreListItem[]
): string[] | undefined {
  const keys = moviesDiscoverActiveFilterKeys(state)
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
    `best tv shows ${y}`,
    'tv shows to watch online',
    'top tv series streaming',
    `trending tv shows ${y}`,
    'where to watch tv shows',
    'tv runtime filters',
  ]
}

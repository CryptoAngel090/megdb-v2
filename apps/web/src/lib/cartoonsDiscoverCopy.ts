import type { CartoonsDiscoverState, TmdbGenreListItem } from '@/lib/tmdb'
import { moviesDiscoverActiveFilterKeys } from '@/lib/tmdb'

export function getCartoonsDiscoverHeroLead(
  state: CartoonsDiscoverState,
  genres: TmdbGenreListItem[]
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
  }

  return 'Animation discovery powered by TMDB. Use filters and sort to find your next cartoon.'
}

export function getCartoonsDiscoverDescription(
  state: CartoonsDiscoverState,
  genres: TmdbGenreListItem[]
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
  }

  return 'Discover animated titles online. Filter cartoons by genre, year, rating, language, runtime and platform.'
}

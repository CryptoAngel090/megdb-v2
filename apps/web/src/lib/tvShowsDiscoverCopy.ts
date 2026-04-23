import type { TmdbGenreListItem, TvShowsDiscoverState } from '@/lib/tmdb'
import { moviesDiscoverActiveFilterKeys } from '@/lib/tmdb'

export function getTvShowsDiscoverHeroLead(
  state: TvShowsDiscoverState,
  genres: TmdbGenreListItem[]
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g)
      return `${g.name} TV picks in ${y}. Refine by year, rating, language, runtime, provider, or studio.`
  }
  if (keys.length > 1)
    return 'Several filters are active. Clear one or reset to browse more TV titles.'
  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV releases credited to ${state.year}. Use filters and sort to fine-tune results.`
  }
  if (keys.length === 0) {
    return `Browse TV in ${y}: starts from 2026 hype picks, then 2025 and older. Filter by runtime, language, provider, and network.`
  }
  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending')
      return 'Trending TV right now. Narrow by genre, year, platform, or runtime.'
    if (state.sortParam === 'top')
      return 'Top-rated TV by audience score and vote count. Filter to match your taste.'
  }
  return 'TV discovery powered by TMDB. Use filters and sort to find your next show.'
}

export function getTvShowsDiscoverDescription(
  state: TvShowsDiscoverState,
  genres: TmdbGenreListItem[]
): string {
  const keys = moviesDiscoverActiveFilterKeys(state)
  const y = new Date().getFullYear()

  if (state.genre && keys.length === 1 && keys[0] === 'genre') {
    const g = genres.find((x) => String(x.id) === state.genre)
    if (g)
      return `Discover popular ${g.name} TV shows in ${y}. Browse titles with ratings, runtime, language and streaming filters.`
  }
  if (keys.length > 1)
    return 'Browse TV shows by genre, year, rating, language, runtime and streaming provider.'
  if (state.year && keys.length === 1 && keys[0] === 'year') {
    return `TV shows credited to ${state.year}. Explore by popularity, rating, language and platform.`
  }
  if (keys.length === 0) {
    return `Discover TV shows to watch online in ${y}. Starts with 2026 hype picks, then older titles, with filters for genre, network, runtime and platform.`
  }
  if (keys.length === 1 && keys[0] === 'sort') {
    if (state.sortParam === 'trending')
      return 'Trending TV shows worldwide, updated from TMDB with advanced filtering.'
    if (state.sortParam === 'top')
      return 'Top-rated TV shows by audience score and vote count with year/runtime/provider filters.'
  }
  return 'Discover TV shows online. Filter by genre, year, rating, language, runtime and streaming platform.'
}

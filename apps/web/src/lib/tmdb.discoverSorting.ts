import type { TmdbDiscoverPage, TmdbRawMedia } from './tmdb.types'

export function rankByHypeDesc(rows: TmdbRawMedia[]): TmdbRawMedia[] {
  return [...rows].sort((a, b) => {
    const byPopularity = b.popularity - a.popularity
    if (byPopularity !== 0) return byPopularity
    const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
    if (byVotes !== 0) return byVotes
    return b.vote_average - a.vote_average
  })
}

export function rankByYearThenHypeDesc(rows: TmdbRawMedia[]): TmdbRawMedia[] {
  return [...rows].sort((a, b) => {
    const yearA = Number.parseInt((a.release_date ?? a.first_air_date ?? '').slice(0, 4), 10)
    const yearB = Number.parseInt((b.release_date ?? b.first_air_date ?? '').slice(0, 4), 10)
    const safeYearA = Number.isFinite(yearA) ? yearA : 0
    const safeYearB = Number.isFinite(yearB) ? yearB : 0
    const byYear = safeYearB - safeYearA
    if (byYear !== 0) return byYear
    const byPopularity = b.popularity - a.popularity
    if (byPopularity !== 0) return byPopularity
    const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0)
    if (byVotes !== 0) return byVotes
    return b.vote_average - a.vote_average
  })
}

export function sortPageByHype(pageData: TmdbDiscoverPage<TmdbRawMedia>): TmdbDiscoverPage<TmdbRawMedia> {
  return {
    ...pageData,
    results: rankByHypeDesc(pageData.results),
  }
}

export function sortPageByYearThenHype(
  pageData: TmdbDiscoverPage<TmdbRawMedia>
): TmdbDiscoverPage<TmdbRawMedia> {
  return {
    ...pageData,
    results: rankByYearThenHypeDesc(pageData.results),
  }
}

type WatchTitleKind = 'movie' | 'series' | 'trailer'

function yearFromIsoDate(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null
  const year = Number(iso.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function withYear(title: string, isoDate: string | null): string {
  const year = yearFromIsoDate(isoDate)
  return year ? `${title} (${year})` : title
}

export function buildWatchSeoTitle(
  title: string,
  isoDate: string | null,
  kind: WatchTitleKind = 'movie'
): string {
  const content = withYear(title, isoDate)
  if (kind === 'series') return `${content} Watch TV Series`
  if (kind === 'trailer') return `${content} Watch Trailer`
  return `${content} Watch Full Movie`
}

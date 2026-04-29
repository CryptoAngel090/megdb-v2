import { containsCyrillic } from './textScript'

export type TmdbReleaseDatesPayload = {
  results?: Array<{ iso_3166_1: string; release_dates: Array<{ certification: string }> }>
} | null

function pickReleaseCertification(data: TmdbReleaseDatesPayload, iso3166: string): string | null {
  if (!data?.results?.length) return null
  const row = data.results.find((r) => r.iso_3166_1?.toUpperCase() === iso3166.toUpperCase())
  if (!row?.release_dates?.length) return null
  const rd = row.release_dates.find((x) => x.certification?.trim()) ?? row.release_dates[0]
  return rd?.certification?.trim() || null
}

export function formatMovieAgeRatingBadge(data: TmdbReleaseDatesPayload): string | null {
  const numericCountries = ['RU', 'BY', 'KZ', 'UA', 'GB'] as const
  for (const iso of numericCountries) {
    const raw = pickReleaseCertification(data, iso)
    if (raw && /^\d{1,2}$/.test(raw)) return `${raw}+`
  }

  const us = pickReleaseCertification(data, 'US')
  if (!us) return null

  const key = us.toUpperCase().replace(/\s+/g, '-')
  const mpaToMinAge: Record<string, number> = {
    G: 0,
    PG: 10,
    'PG-13': 13,
    R: 17,
    'NC-17': 18,
    'TV-Y': 0,
    'TV-Y7': 7,
    'TV-G': 0,
    'TV-PG': 10,
    'TV-14': 14,
    'TV-MA': 18,
  }
  const skip = new Set(['NR', 'NOT-RATED', 'NOTRATED', 'UR', ''])

  if (skip.has(key)) return null
  const age = mpaToMinAge[key]
  if (typeof age === 'number') return `${age}+`

  return null
}

export type TmdbTvContentRatingsPayload = {
  results?: Array<{ iso_3166_1?: string; rating?: string }>
} | null

export function formatTvContentRatingBadge(data: TmdbTvContentRatingsPayload): string | null {
  if (!data?.results?.length) return null
  const us = data.results.find((r) => (r.iso_3166_1 ?? '').toUpperCase() === 'US')?.rating?.trim()
  if (us) return us
  const gb = data.results.find((r) => (r.iso_3166_1 ?? '').toUpperCase() === 'GB')?.rating?.trim()
  if (gb) return gb
  const fallbackRating = data.results.find((r) => r.rating?.trim())?.rating?.trim()
  return fallbackRating ?? null
}

const ALT_TITLE_COUNTRY_ORDER = ['US', 'GB', 'AU', 'CA', 'IE', 'NZ'] as const

export function pickAlternateDisplayTitle(
  titles: Array<{ iso_3166_1?: string; title?: string }> | undefined,
  mainTitle: string,
  originalTitle: string
): string | null {
  const mainL = mainTitle.trim().toLowerCase()
  const origL = originalTitle.trim().toLowerCase()
  const origIsLatin = Boolean(originalTitle.trim()) && !containsCyrillic(originalTitle)
  const seen = new Set<string>()

  const take = (raw: string | undefined | null): string | null => {
    const s = raw?.trim()
    if (!s || containsCyrillic(s)) return null
    const sl = s.toLowerCase()
    if (sl === mainL) return null
    if (origIsLatin && sl === origL) return null
    if (seen.has(sl)) return null
    seen.add(sl)
    return s
  }

  const rows = titles?.filter((t) => t.title?.trim()) ?? []

  for (const iso of ALT_TITLE_COUNTRY_ORDER) {
    const u = iso.toUpperCase()
    for (const t of rows) {
      if ((t.iso_3166_1 ?? '').toUpperCase() !== u) continue
      const hit = take(t.title)
      if (hit) return hit
    }
  }
  for (const t of rows) {
    const hit = take(t.title)
    if (hit) return hit
  }
  return null
}

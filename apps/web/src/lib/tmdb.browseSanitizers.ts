const DISCOVER_SORT_WHITELIST = new Set([
  'popularity.desc',
  'popularity.asc',
  'release_date.desc',
  'release_date.asc',
  'vote_average.desc',
  'vote_average.asc',
  'original_title.asc',
  'revenue.desc',
])

const RUNTIME_BUCKETS = new Set([
  '0-25',
  '25-45',
  '45-60',
  '60-999',
  '0-90',
  '90-120',
  '120-150',
  '150-999',
])

export function clampBrowseYear(raw: string, fallback: number): number {
  const y = Number.parseInt(raw, 10)
  if (!Number.isFinite(y)) return fallback
  return Math.min(2035, Math.max(1950, y))
}

export function qp(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key]
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : v
}

export function sanitizeDiscoverSortParam(raw: string | undefined): string {
  if (raw == null || raw === '') return 'popularity.desc'
  const s = raw.trim()
  if (s.toLowerCase() === 'trending') return 'trending'
  if (s.toLowerCase() === 'top') return 'top'
  if (DISCOVER_SORT_WHITELIST.has(s)) return s
  return 'popularity.desc'
}

export function sanitizeDigitsId(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  if (!/^\d+$/.test(raw)) return undefined
  return raw
}

export function sanitizeVoteAverageGte(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n < 0 || n > 10) return undefined
  return String(n)
}

export function sanitizeIso639(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(s)) return undefined
  return s
}

export function sanitizeIso3166(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(s)) return undefined
  return s
}

export function sanitizeRuntimeBucket(raw: string | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim()
  if (!RUNTIME_BUCKETS.has(s)) return undefined
  return s
}

export function parseExpectedMonthParam(
  raw: string | undefined
): { y: number; m: number } | undefined {
  if (raw == null || raw === '') return undefined
  const s = raw.trim()
  if (!/^\d{4}-\d{2}$/.test(s)) return undefined
  const [ys, ms] = s.split('-')
  const y = Number(ys)
  const m = Number(ms)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return undefined
  return { y, m }
}

export function sanitizeCalendarMonth(raw: string | undefined): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1 || n > 12) return undefined
  return n
}

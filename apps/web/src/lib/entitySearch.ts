const GENERIC_ENTITY_TERMS = new Set([
  'movie',
  'movies',
  'film',
  'films',
  'tv',
  'show',
  'shows',
  'series',
  'franchise',
  'franchises',
  'collection',
  'collections',
  'studio',
  'studios',
  'pictures',
  'production',
  'productions',
  'entertainment',
])

function normalizeEntityQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

function isEntitySearchQueryStable(raw: string): boolean {
  const query = normalizeEntityQuery(raw)
  if (query.length < 3 || query.length > 80) return false
  if (!/[a-z0-9]/i.test(query)) return false
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
  if (tokens.length === 0 || tokens.length > 8) return false
  if (tokens.every((t) => GENERIC_ENTITY_TERMS.has(t))) return false
  const significant = tokens.filter((t) => t.length >= 3 && !GENERIC_ENTITY_TERMS.has(t))
  return significant.length >= 1
}

export function buildEntitySearchHref(raw: string): string | null {
  const query = normalizeEntityQuery(raw)
  if (!isEntitySearchQueryStable(query)) return null
  const params = new URLSearchParams({ q: query })
  return `/search?${params.toString()}`
}

export function entityCanonicalSlug(raw: string): string | null {
  const query = normalizeEntityQuery(raw).toLowerCase()
  if (!isEntitySearchQueryStable(query)) return null
  const slug = query
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug.length >= 3 ? slug : null
}

export function entityQueryFromSlug(slug: string): string | null {
  const normalizedSlug = slug.trim().toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) return null
  const query = normalizedSlug.replace(/-/g, ' ')
  return isEntitySearchQueryStable(query) ? query : null
}

export function buildEntityCanonicalHref(raw: string): string | null {
  const slug = entityCanonicalSlug(raw)
  return slug ? `/entity/${slug}` : null
}


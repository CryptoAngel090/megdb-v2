const DEFAULT_ORDER = [
  'genre',
  'year',
  'coming',
  'expected',
  'provider',
  'studio',
  'rating',
  'language',
  'country',
  'runtime',
  'sort',
] as const

type CanonicalValue = string | number | null | undefined

export function buildCanonicalPath(
  basePath: string,
  params: Record<string, CanonicalValue>,
  orderedKeys: readonly string[] = DEFAULT_ORDER
): string {
  const orderIndex = new Map<string, number>()
  orderedKeys.forEach((key, index) => orderIndex.set(key, index))

  const entries = Object.entries(params)
    .filter(([, value]) => value != null && String(value).trim().length > 0)
    .map(([key, value]) => [key, String(value).trim()] as const)
    .sort((a, b) => {
      const ai = orderIndex.get(a[0]) ?? Number.MAX_SAFE_INTEGER
      const bi = orderIndex.get(b[0]) ?? Number.MAX_SAFE_INTEGER
      if (ai !== bi) return ai - bi
      return a[0].localeCompare(b[0])
    })

  if (entries.length === 0) return basePath
  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return `${basePath}?${query}`
}

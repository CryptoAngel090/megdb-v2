import { normalizeRoutePath } from './seo-internal-links-core.mjs'

export function parseRouteQueryKeys(rawHref) {
  const raw = String(rawHref || '').trim()
  if (!raw.startsWith('/')) return null
  const [pathPart, queryPart = ''] = raw.split('?')
  const path = normalizeRoutePath(pathPart)
  if (!path) return null
  const params = new URLSearchParams(queryPart)
  const keys = Array.from(new Set(Array.from(params.keys())))
  return { path, keys }
}

export function toRouteDepths(startRoute, adjacency, globalTargets = []) {
  const depths = new Map()
  const queue = []
  depths.set(startRoute, 0)
  queue.push(startRoute)

  // Apply global targets only from the start route.
  if (globalTargets.length > 0) {
    const seed = adjacency.get(startRoute) ?? new Set()
    for (const t of globalTargets) seed.add(t)
    adjacency.set(startRoute, seed)
  }

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    const baseDepth = depths.get(current) ?? 0
    const next = new Set(adjacency.get(current) ?? [])
    for (const route of next) {
      if (depths.has(route)) continue
      depths.set(route, baseDepth + 1)
      queue.push(route)
    }
  }
  return depths
}

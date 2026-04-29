import { describe, expect, it } from 'vitest'
import { parseRouteQueryKeys, toRouteDepths } from '../../scripts/seo-crawl-budget-core.mjs'

describe('parseRouteQueryKeys', () => {
  it('extracts path and unique keys from query', () => {
    expect(parseRouteQueryKeys('/movies?genre=28&sort=top&genre=12')).toEqual({
      path: '/movies',
      keys: ['genre', 'sort'],
    })
  })

  it('rejects non-internal paths', () => {
    expect(parseRouteQueryKeys('https://megdb.com/movies')).toBeNull()
  })
})

describe('toRouteDepths', () => {
  it('calculates bfs depth with global targets', () => {
    const adjacency = new Map<string, Set<string>>()
    adjacency.set('/movies', new Set(['/categories']))
    const depths = toRouteDepths('/', adjacency, ['/movies'])
    expect(depths.get('/')).toBe(0)
    expect(depths.get('/movies')).toBe(1)
    expect(depths.get('/categories')).toBe(2)
  })

  it('does not fan out global targets from every node', () => {
    const adjacency = new Map<string, Set<string>>()
    adjacency.set('/movies', new Set(['/about']))
    const depths = toRouteDepths('/', adjacency, ['/movies', '/series'])
    expect(depths.get('/series')).toBe(1)
    expect(depths.get('/about')).toBe(2)
  })
})

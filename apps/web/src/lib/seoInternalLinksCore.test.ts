import { describe, expect, it } from 'vitest'
import {
  buildInboundGraph,
  normalizeRoutePath,
  siteUrlTokenToPath,
} from '../../scripts/seo-internal-links-core.mjs'

describe('normalizeRoutePath', () => {
  it('normalizes query/hash/trailing slash', () => {
    expect(normalizeRoutePath('/movies?sort=top')).toBe('/movies')
    expect(normalizeRoutePath('/about/')).toBe('/about')
    expect(normalizeRoutePath('/series#anchor')).toBe('/series')
  })

  it('rejects external or api paths', () => {
    expect(normalizeRoutePath('https://megdb.com/movies')).toBeNull()
    expect(normalizeRoutePath('/api/seo/indexnow')).toBeNull()
  })
})

describe('siteUrlTokenToPath', () => {
  it('maps sitemap contract tokens to route paths', () => {
    expect(siteUrlTokenToPath('SITE_URL')).toBe('/')
    expect(siteUrlTokenToPath('${SITE_URL}/movies')).toBe('/movies')
    expect(siteUrlTokenToPath('invalid')).toBeNull()
  })
})

describe('buildInboundGraph', () => {
  it('collects inbound links from Link/router usages', () => {
    const files = [
      {
        path: 'src/components/Nav.tsx',
        source:
          'const x = <Link href="/movies">Movies</Link>; router.push("/series?sort=top"); const y = { href: "/about" }',
      },
    ]
    const graph = buildInboundGraph(files) as Map<string, Set<string>>
    expect(graph.get('/movies')?.size).toBe(1)
    expect(graph.get('/series')?.size).toBe(1)
    expect(graph.get('/about')?.size).toBe(1)
  })
})

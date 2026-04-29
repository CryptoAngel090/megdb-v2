import { describe, expect, it } from 'vitest'
import {
  policyTokenToRoute,
  routeToPageFile,
  routeToRobotsDisallow,
} from '../../scripts/seo-consistency-core.mjs'

describe('policyTokenToRoute', () => {
  it('maps sitemap tokens to route paths', () => {
    expect(policyTokenToRoute('SITE_URL')).toBe('/')
    expect(policyTokenToRoute('${SITE_URL}/movies')).toBe('/movies')
    expect(policyTokenToRoute('${SITE_URL}/person/')).toBe('/person')
    expect(policyTokenToRoute('broken')).toBeNull()
  })
})

describe('routeToRobotsDisallow', () => {
  it('converts dynamic route to disallow prefix', () => {
    expect(routeToRobotsDisallow('/person/[id]')).toBe('/person/')
    expect(routeToRobotsDisallow('/search')).toBe('/search')
  })
})

describe('routeToPageFile', () => {
  it('builds app route file path', () => {
    const file = routeToPageFile('C:/repo/apps/web/src/app', '/about')
    if (!file) throw new Error('Expected route file path')
    expect(file.replaceAll('\\', '/')).toContain('/about/page.tsx')
  })
})

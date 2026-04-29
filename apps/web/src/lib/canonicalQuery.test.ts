import { describe, expect, it } from 'vitest'
import { buildCanonicalPath } from './canonicalQuery'

describe('buildCanonicalPath', () => {
  it('keeps canonical key order', () => {
    const path = buildCanonicalPath('/movies', {
      sort: 'top',
      genre: '28',
      year: '2024',
    })
    expect(path).toBe('/movies?genre=28&year=2024&sort=top')
  })

  it('omits blank and null values', () => {
    const path = buildCanonicalPath('/series', {
      genre: '18',
      sort: '',
      country: null,
      language: undefined,
    })
    expect(path).toBe('/series?genre=18')
  })
})

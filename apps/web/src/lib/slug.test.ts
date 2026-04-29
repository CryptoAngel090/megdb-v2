import { describe, expect, it } from 'vitest'
import { detailPathForMedia, detailPathForShelfItem, releaseDateToYmd, seriesPath } from './slug'

describe('releaseDateToYmd', () => {
  it('normalizes Date to ISO day', () => {
    expect(releaseDateToYmd(new Date('2021-06-15T12:00:00.000Z'))).toBe('2021-06-15')
  })

  it('passes through YYYY-MM-DD strings', () => {
    expect(releaseDateToYmd('  2019-03-01  ')).toBe('2019-03-01')
  })

  it('returns a year prefix for year-only strings', () => {
    expect(releaseDateToYmd('2024')).toBe('2024')
  })
})

describe('detailPathForShelfItem (TV canon)', () => {
  it('maps tvshow and series to the same /series/… path', () => {
    const tv = { title: 'Breaking Bad', releaseDate: '2008-01-20' as const }
    const a = detailPathForShelfItem({ type: 'tvshow', ...tv })
    const b = detailPathForShelfItem({ type: 'series', ...tv })
    expect(a).toBe(b)
    expect(a).toBe(seriesPath('Breaking Bad', '2008-01-20'))
  })
})

describe('detailPathForMedia', () => {
  it('aligns tvshow with series', () => {
    const d = '2016-07-15'
    expect(detailPathForMedia('tvshow', 'Stranger Things', d)).toBe(
      detailPathForMedia('series', 'Stranger Things', d)
    )
  })
})

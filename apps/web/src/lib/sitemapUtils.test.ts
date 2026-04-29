import { describe, expect, it } from 'vitest'
import { chunkSitemapEntries, toSitemapIds } from './sitemapUtils'

describe('chunkSitemapEntries', () => {
  it('splits entries by chunk size', () => {
    const entries = [
      { url: 'https://megdb.com/1' },
      { url: 'https://megdb.com/2' },
      { url: 'https://megdb.com/3' },
    ]
    const chunks = chunkSitemapEntries(entries, 2)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(2)
    expect(chunks[1]).toHaveLength(1)
  })

  it('returns one empty chunk when no entries', () => {
    const chunks = chunkSitemapEntries([], 5000)
    expect(chunks).toEqual([[]])
  })
})

describe('toSitemapIds', () => {
  it('returns numeric sitemap ids', () => {
    expect(toSitemapIds(3)).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }])
  })
})

import { describe, expect, it } from 'vitest'
import {
  FETCH_REVALIDATE_ALL_TIME,
  FETCH_REVALIDATE_DEFAULT,
  FETCH_REVALIDATE_FAST,
  FETCH_REVALIDATE_MODERATE,
  FETCH_REVALIDATE_PEOPLE,
  FETCH_REVALIDATE_RANDOM_MOVIE,
  ROUTE_REVALIDATE_DISCOVER_HUB,
  ROUTE_REVALIDATE_HOME,
  ROUTE_REVALIDATE_MEDIA_DETAIL,
  ROUTE_REVALIDATE_SEARCH_DYNAMIC,
  ROUTE_REVALIDATE_SITEMAP,
  ROUTE_REVALIDATE_STATIC_COPY,
} from './cachePolicy'

describe('cachePolicy invariants', () => {
  it('home ISR is not slower than the fastest fetch tier used on the homepage', () => {
    expect(ROUTE_REVALIDATE_HOME).toBeLessThanOrEqual(FETCH_REVALIDATE_FAST)
  })

  it('discover hub ISR is not slower than the default fetch tier on those pages', () => {
    expect(ROUTE_REVALIDATE_DISCOVER_HUB).toBeLessThanOrEqual(FETCH_REVALIDATE_DEFAULT)
  })

  it('search is fully dynamic', () => {
    expect(ROUTE_REVALIDATE_SEARCH_DYNAMIC).toBe(0)
  })

  it('detail and sitemap share the same media-detail window', () => {
    expect(ROUTE_REVALIDATE_SITEMAP).toBe(ROUTE_REVALIDATE_MEDIA_DETAIL)
  })

  it('long-tail fetch tier does not exceed static copy route window', () => {
    expect(FETCH_REVALIDATE_ALL_TIME).toBeLessThanOrEqual(ROUTE_REVALIDATE_STATIC_COPY)
  })

  it('random-movie API cache is short', () => {
    expect(FETCH_REVALIDATE_RANDOM_MOVIE).toBeLessThan(FETCH_REVALIDATE_FAST)
  })

  it('tiers are ordered (fast < moderate < default/people < all-time)', () => {
    expect(FETCH_REVALIDATE_FAST).toBeLessThan(FETCH_REVALIDATE_MODERATE)
    expect(FETCH_REVALIDATE_MODERATE).toBeLessThan(FETCH_REVALIDATE_DEFAULT)
    expect(FETCH_REVALIDATE_DEFAULT).toBeLessThanOrEqual(FETCH_REVALIDATE_PEOPLE)
    expect(FETCH_REVALIDATE_PEOPLE).toBeLessThan(FETCH_REVALIDATE_ALL_TIME)
  })
})

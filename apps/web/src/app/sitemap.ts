import type { MetadataRoute } from 'next'
import { fetchDiscoverUrlsForSitemap } from '@/lib/sitemapDiscoverUrls'
import { SITE_URL } from '@/lib/site'

/**
 * Sitemap rebuild interval. Detail URLs are merged from TMDB-backed homepage/discover feeds
 * (see `fetchDiscoverUrlsForSitemap`).
 */
export const revalidate = 3600

const now = () => new Date()

/** Static list & trust routes — `/search` omitted (internal search is not a discovery target). */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: now(), changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/movies`, lastModified: now(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/series`, lastModified: now(), changeFrequency: 'daily', priority: 0.9 },
  {
    url: `${SITE_URL}/cartoons`,
    lastModified: now(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  { url: `${SITE_URL}/tvshows`, lastModified: now(), changeFrequency: 'daily', priority: 0.8 },
  {
    url: `${SITE_URL}/categories`,
    lastModified: now(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  { url: `${SITE_URL}/about`, lastModified: now(), changeFrequency: 'monthly', priority: 0.4 },
  {
    url: `${SITE_URL}/contact`,
    lastModified: now(),
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  { url: `${SITE_URL}/help`, lastModified: now(), changeFrequency: 'monthly', priority: 0.25 },
  {
    url: `${SITE_URL}/accessibility`,
    lastModified: now(),
    changeFrequency: 'monthly',
    priority: 0.25,
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: now(),
    changeFrequency: 'yearly',
    priority: 0.2,
  },
  { url: `${SITE_URL}/terms`, lastModified: now(), changeFrequency: 'yearly', priority: 0.2 },
  {
    url: `${SITE_URL}/cookies`,
    lastModified: now(),
    changeFrequency: 'yearly',
    priority: 0.15,
  },
  { url: `${SITE_URL}/gdpr`, lastModified: now(), changeFrequency: 'yearly', priority: 0.15 },
  { url: `${SITE_URL}/dmca`, lastModified: now(), changeFrequency: 'yearly', priority: 0.15 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const discover = await fetchDiscoverUrlsForSitemap()
  return [...STATIC_ROUTES, ...discover]
}

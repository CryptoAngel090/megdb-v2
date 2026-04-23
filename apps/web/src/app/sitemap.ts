import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** Static routes — always indexed */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/movies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  {
    url: `${SITE_URL}/cartoons`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  { url: `${SITE_URL}/tvshows`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  {
    url: `${SITE_URL}/categories`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  {
    url: `${SITE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.2,
  },
  { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES
}

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/_next/',
          '/api/',
          /* Dev / internal */
          '/ui-kit',
          /* Thin / utility (pages use noindex; disallow reduces crawl noise) */
          '/categories',
          '/movies/random',
          /* Thin or non-canonical surfaces */
          '/trailer/',
          /* Auth, account, and internal search (pages use noindex; robots avoids crawl budget noise) */
          '/login',
          '/register',
          '/profile',
          '/settings',
          '/search',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

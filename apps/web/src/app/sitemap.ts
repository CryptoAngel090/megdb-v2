import { statSync } from 'node:fs'
import { join } from 'node:path'
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { fetchDiscoverUrlsForSitemap } from '@/lib/sitemapDiscoverUrls'
import { chunkSitemapEntries, toSitemapIds } from '@/lib/sitemapUtils'

/** @sync `ROUTE_REVALIDATE_SITEMAP` in `@/lib/cachePolicy` */
export const revalidate = 3600

const APP_DIR = join(process.cwd(), 'src', 'app')
const SITEMAP_CHUNK_SIZE = Number.parseInt(process.env.SITEMAP_CHUNK_SIZE || '5000', 10)
const SITEMAP_FALLBACK_LASTMOD = (() => {
  const raw = process.env.SEO_BUILD_TIMESTAMP || process.env.SOURCE_DATE_EPOCH
  if (!raw) return new Date('2026-01-01T00:00:00.000Z')
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric > 0) {
    // SOURCE_DATE_EPOCH is seconds in many environments.
    return new Date(numeric > 1e12 ? numeric : numeric * 1000)
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date('2026-01-01T00:00:00.000Z') : parsed
})()

function latestMtime(filePaths: string[]): Date {
  let latest = 0
  for (const rel of filePaths) {
    const abs = join(APP_DIR, rel)
    try {
      const mtime = statSync(abs).mtimeMs
      if (mtime > latest) latest = mtime
    } catch {
      // keep fallback date when file does not exist
    }
  }
  return latest > 0 ? new Date(latest) : SITEMAP_FALLBACK_LASTMOD
}

type StaticSitemapRoute = {
  url: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  sourceFiles: string[]
}

/** Static list & trust routes — `/search` omitted (internal search is not a discovery target). */
const STATIC_ROUTES: StaticSitemapRoute[] = [
  {
    /* Trailing `/` must match `discoverPageAlternates('/')` / `absoluteUrl('/')` (see SEO ops — root canonical alignment). */
    url: `${SITE_URL}/`,
    changeFrequency: 'daily',
    priority: 1.0,
    sourceFiles: ['page.tsx', 'layout.tsx'],
  },
  {
    url: `${SITE_URL}/movies`,
    changeFrequency: 'daily',
    priority: 0.9,
    sourceFiles: ['movies/page.tsx'],
  },
  {
    url: `${SITE_URL}/series`,
    changeFrequency: 'daily',
    priority: 0.9,
    sourceFiles: ['series/page.tsx'],
  },
  {
    url: `${SITE_URL}/cartoons`,
    changeFrequency: 'daily',
    priority: 0.8,
    sourceFiles: ['cartoons/page.tsx'],
  },
  {
    url: `${SITE_URL}/tvshows`,
    changeFrequency: 'daily',
    priority: 0.8,
    sourceFiles: ['tvshows/page.tsx'],
  },
  {
    url: `${SITE_URL}/about`,
    changeFrequency: 'monthly',
    priority: 0.4,
    sourceFiles: ['about/page.tsx'],
  },
  {
    url: `${SITE_URL}/contact`,
    changeFrequency: 'monthly',
    priority: 0.3,
    sourceFiles: ['contact/page.tsx'],
  },
  {
    url: `${SITE_URL}/help`,
    changeFrequency: 'monthly',
    priority: 0.25,
    sourceFiles: ['help/page.tsx'],
  },
  {
    url: `${SITE_URL}/accessibility`,
    changeFrequency: 'monthly',
    priority: 0.25,
    sourceFiles: ['accessibility/page.tsx'],
  },
  {
    url: `${SITE_URL}/privacy`,
    changeFrequency: 'yearly',
    priority: 0.2,
    sourceFiles: ['privacy/page.tsx'],
  },
  {
    url: `${SITE_URL}/terms`,
    changeFrequency: 'yearly',
    priority: 0.2,
    sourceFiles: ['terms/page.tsx'],
  },
  {
    url: `${SITE_URL}/cookies`,
    changeFrequency: 'yearly',
    priority: 0.15,
    sourceFiles: ['cookies/page.tsx'],
  },
  {
    url: `${SITE_URL}/gdpr`,
    changeFrequency: 'yearly',
    priority: 0.15,
    sourceFiles: ['gdpr/page.tsx'],
  },
  {
    url: `${SITE_URL}/dmca`,
    changeFrequency: 'yearly',
    priority: 0.15,
    sourceFiles: ['dmca/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/mission-impossible`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/john-wick`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/the-fast-saga`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/mad-max`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/the-matrix`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/harry-potter`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/star-wars`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
  {
    url: `${SITE_URL}/entity/dune`,
    changeFrequency: 'weekly',
    priority: 0.7,
    sourceFiles: ['entity/[slug]/page.tsx'],
  },
]

function staticEntriesWithDataLastMod(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => ({
    url: route.url,
    lastModified: latestMtime(route.sourceFiles),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}

async function buildAllEntries(): Promise<MetadataRoute.Sitemap> {
  const discover = await fetchDiscoverUrlsForSitemap()
  return [...staticEntriesWithDataLastMod(), ...discover]
}

export async function generateSitemaps() {
  const all = await buildAllEntries()
  const chunks = chunkSitemapEntries(all, SITEMAP_CHUNK_SIZE)
  return toSitemapIds(chunks.length)
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const all = await buildAllEntries()
  const chunks = chunkSitemapEntries(all, SITEMAP_CHUNK_SIZE)
  return chunks[id] ?? []
}

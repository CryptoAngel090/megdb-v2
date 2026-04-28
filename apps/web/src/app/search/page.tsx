import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SearchPageClient } from '@/components/SearchPage/SearchPageClient'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { buildEntityCanonicalHref } from '@/lib/entitySearch'
import { buildSearchSnippetTemplate } from '@/lib/seoSnippetTemplates'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_SEARCH_DYNAMIC` in `@/lib/cachePolicy` */
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function queryFromSearchParams(sp: Record<string, string | string[] | undefined>): string {
  const raw = sp.q
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && raw[0]) return raw[0]
  return ''
}

function webPageInfoFromQuery(q: string): {
  title: string
  description: string
  path: string
  snippetCohort: string
} {
  const snippet = buildSearchSnippetTemplate({ query: q })
  if (q.length >= 2) {
    const qs = new URLSearchParams({ q }).toString()
    return {
      path: `/search?${qs}`,
      title: snippet.title,
      description: snippet.description,
      snippetCohort: snippet.cohort,
    }
  }
  return {
    path: '/search',
    title: snippet.title,
    description: snippet.description,
    snippetCohort: snippet.cohort,
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const q = queryFromSearchParams(sp).trim()
  const { title, description, snippetCohort } = webPageInfoFromQuery(q)
  const robots = { index: false, follow: true } as const
  return {
    title,
    description,
    robots,
    alternates: discoverPageAlternates('/search'),
    ...discoverSocialMeta(title, description, '/search'),
    other: {
      'megdb:snippet-cohort': snippetCohort,
    },
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const initialQuery = queryFromSearchParams(sp).trim()
  if (initialQuery.length >= 2) {
    const canonicalEntity = buildEntityCanonicalHref(initialQuery)
    if (canonicalEntity) redirect(canonicalEntity)
  }
  const { title, description, path } = webPageInfoFromQuery(initialQuery)
  return (
    <>
      <WebPageJsonLd pathname={path} title={title} description={description} />
      <div className={styles.page}>
        <SearchPageClient initialQuery={initialQuery} />
      </div>
    </>
  )
}

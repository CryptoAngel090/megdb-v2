import type { Metadata } from 'next'
import { SearchPageClient } from '@/components/SearchPage/SearchPageClient'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

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

function webPageInfoFromQuery(q: string): { title: string; description: string; path: string } {
  if (q.length >= 2) {
    const qs = new URLSearchParams({ q }).toString()
    return {
      path: `/search?${qs}`,
      title: `Search: ${q}`,
      description: `Search results for “${q}” — movies, series, and people on MegDB.`,
    }
  }
  return {
    path: '/search',
    title: 'Search',
    description: 'Search movies, TV series, and people on MegDB via The Movie Database (TMDB).',
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const q = queryFromSearchParams(sp).trim()
  const { title, description, path } = webPageInfoFromQuery(q)
  const robots = { index: false, follow: true } as const
  return {
    title,
    description,
    robots,
    alternates: { canonical: path },
    ...discoverSocialMeta(title, description, path),
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const initialQuery = queryFromSearchParams(sp).trim()
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

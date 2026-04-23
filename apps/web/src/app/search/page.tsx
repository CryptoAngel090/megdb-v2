import type { Metadata } from 'next'
import { SearchPageClient } from '@/components/SearchPage/SearchPageClient'
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

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const q = queryFromSearchParams(sp).trim()
  if (q.length >= 2) {
    return {
      title: `Search: ${q}`,
      description: `Search results for “${q}” — movies, series, and people on MegDB.`,
    }
  }
  return {
    title: 'Search',
    description: 'Search movies, TV series, and people on MegDB via The Movie Database (TMDB).',
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const initialQuery = queryFromSearchParams(sp)
  return (
    <div className={styles.page}>
      <SearchPageClient initialQuery={initialQuery} />
    </div>
  )
}

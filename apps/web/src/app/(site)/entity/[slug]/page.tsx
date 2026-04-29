import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SearchPageClient } from '@/components/SearchPage/SearchPageClient'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { buildEntitySnippetTemplate } from '@/lib/seoSnippetTemplates'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { entityCanonicalSlug, entityQueryFromSlug } from '@/lib/entitySearch'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_SEARCH_DYNAMIC` in `@/lib/cachePolicy` */
export const revalidate = 0

type PageProps = {
  params: Promise<{ slug: string }>
}

const ENTITY_QUERY_SEEDS = [
  'Mission Impossible',
  'John Wick',
  'The Fast Saga',
  'Mad Max',
  'The Matrix',
  'Harry Potter',
  'Star Wars',
  'Dune',
] as const

function titleCase(input: string): string {
  return input.replace(/\b[a-z]/g, (m) => m.toUpperCase())
}

function buildEntityPath(slug: string): string {
  return `/entity/${slug}`
}

export function generateStaticParams() {
  return ENTITY_QUERY_SEEDS.map((query) => entityCanonicalSlug(query))
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const query = entityQueryFromSlug(slug)
  if (!query) {
    return {
      title: 'Entity',
      description: 'MegDB entity discovery page.',
      robots: { index: false, follow: true },
    }
  }
  const snippet = buildEntitySnippetTemplate({ query: titleCase(query), slug })
  const path = buildEntityPath(slug)
  return {
    title: snippet.title,
    description: snippet.description,
    robots: { index: true, follow: true },
    alternates: discoverPageAlternates(path),
    ...discoverSocialMeta(snippet.title, snippet.description, path),
    other: {
      'megdb:snippet-cohort': snippet.cohort,
    },
  }
}

export default async function EntityPage({ params }: PageProps) {
  const { slug } = await params
  const query = entityQueryFromSlug(slug)
  if (!query) notFound()
  const path = buildEntityPath(slug)
  const snippet = buildEntitySnippetTemplate({ query: titleCase(query), slug })

  return (
    <div className={styles.page}>
      <WebPageJsonLd
        pathname={path}
        title={snippet.title}
        description={snippet.description}
        includeBreadcrumb={false}
      />
      <section className={styles.hero} aria-label={`${query} entity hub`}>
        <h1 className={styles.h1}>{titleCase(query)}</h1>
        <p className={styles.lead}>
          This is the canonical MegDB entity page for <strong>{query}</strong>. It consolidates
          internal links for related titles and people to reduce duplicate query surfaces.
        </p>
        <div className={styles.links}>
          <Link href="/movies" className={styles.link}>
            Browse movies
          </Link>
          <Link href="/series" className={styles.link}>
            Browse series
          </Link>
          <Link href="/categories" className={styles.link}>
            Explore categories
          </Link>
        </div>
      </section>
      <SearchPageClient initialQuery={query} />
    </div>
  )
}

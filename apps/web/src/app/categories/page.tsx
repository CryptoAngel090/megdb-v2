import type { Metadata } from 'next'
import { BrowseSectionPage } from '@/components/BrowseSectionPage/BrowseSectionPage'
import { buildCollectionPageJsonLd } from '@/lib/jsonLdSite'
import { discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

const title = 'Categories'
const description = 'Browse MegDB by genre and category.'
const collectionLd = buildCollectionPageJsonLd({
  name: title,
  description,
  pathname: '/categories',
})

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/categories' },
  ...discoverSocialMeta(title, description, '/categories'),
}

export default function CategoriesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <div className={styles.page}>
        <BrowseSectionPage
          title="Categories"
          description="Genre and topic hubs will appear here as the catalog grows."
        />
      </div>
    </>
  )
}

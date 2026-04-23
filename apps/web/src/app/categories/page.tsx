import type { Metadata } from 'next'
import { BrowseSectionPage } from '@/components/BrowseSectionPage/BrowseSectionPage'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse MegDB by genre and category.',
}

export default function CategoriesPage() {
  return (
    <div className={styles.page}>
      <BrowseSectionPage
        title="Categories"
        description="Genre and topic hubs will appear here as the catalog grows."
      />
    </div>
  )
}

import type { Metadata } from 'next'
import { BrowseSectionPage } from '@/components/BrowseSectionPage/BrowseSectionPage'
import styles from './page.module.css'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Person ${id}` }
}

export default async function PersonPage({ params }: Props) {
  const { id } = await params
  return (
    <div className={styles.page}>
      <BrowseSectionPage
        title="Actor profile"
        description={`TMDB person #${id}. Filmography and credits are coming soon.`}
      />
    </div>
  )
}

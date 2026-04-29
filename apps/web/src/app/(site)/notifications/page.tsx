import type { Metadata } from 'next'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

const title = 'Notifications — MegDB'
const description = 'Manage your MegDB notifications and account alerts.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/notifications'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/notifications'),
}

export default function NotificationsPage() {
  return (
    <section className={styles.page}>
      <WebPageJsonLd pathname="/notifications" title={title} description={description} />
      <h1 className={styles.title}>Notifications</h1>
      <p className={styles.lead}>
        Notifications center is available. Detailed controls will be expanded in the next UI pass.
      </p>
    </section>
  )
}

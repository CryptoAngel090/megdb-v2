import type { Metadata } from 'next'
import { RegisterForm } from '@/components/RegisterForm/RegisterForm'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

const title = 'Sign Up — MegDB'
const description =
  'MegDB registration (noindex): create an account for ratings, watchlist, and synced preferences — TMDB powers catalogue data.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/register'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/register'),
}

export default function RegisterPage() {
  return (
    <>
      <WebPageJsonLd pathname="/register" title={title} description={description} />
      <div className={styles.page}>
        <RegisterForm />
      </div>
    </>
  )
}

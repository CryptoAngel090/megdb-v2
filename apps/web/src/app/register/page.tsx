import type { Metadata } from 'next'
import { RegisterForm } from '@/components/RegisterForm/RegisterForm'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

const title = 'Sign Up — MegDB'
const description = 'Create your MegDB account to track movies, rate films, and build your watchlist.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/register' },
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

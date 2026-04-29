import type { Metadata } from 'next'
import { LoginForm } from '@/components/LoginForm/LoginForm'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'

const title = 'Sign In — MegDB'
const description =
  'MegDB sign-in (noindex): access your account and saved preferences — English-first interface.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/login'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/login'),
}

export default function LoginPage() {
  return (
    <>
      <WebPageJsonLd pathname="/login" title={title} description={description} />
      <LoginForm />
    </>
  )
}

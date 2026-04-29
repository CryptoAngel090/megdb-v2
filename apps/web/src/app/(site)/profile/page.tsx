import type { Metadata } from 'next'
import { ProfilePage } from '@/components/ProfilePage/ProfilePage'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'

const title = 'My Profile — MegDB'
const description =
  'MegDB profile (noindex): view watchlist and account shortcuts — discovery catalogue remains on public movie and TV pages.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/profile'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/profile'),
}

export default function Profile() {
  return (
    <>
      <WebPageJsonLd pathname="/profile" title={title} description={description} />
      <ProfilePage />
    </>
  )
}

import type { Metadata } from 'next'
import { WatchlistPage } from '@/components/WatchlistPage/WatchlistPage'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'

const title = 'My Watchlist — MegDB'
const description = 'Track movies you saved in your local MegDB watchlist and jump to detail pages.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/watchlist'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/watchlist'),
}

export default function WatchlistRoute() {
  return (
    <>
      <WebPageJsonLd pathname="/watchlist" title={title} description={description} />
      <WatchlistPage />
    </>
  )
}

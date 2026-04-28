import type { Metadata } from 'next'
import { Suspense } from 'react'
import { HeroSection } from '@/components/HeroSection/HeroSection'
import { HomeDiscoverShelves } from '@/components/HomeDiscoverShelves/HomeDiscoverShelves'
import { HomeShelvesFallbackClient } from '@/components/HomeDiscoverShelves/HomeShelvesFallbackClient'
import { getHeroItems } from '@/lib/tmdb'
import { HomeLcpPreloadLinks } from '@/components/HomeLcpPreloadLinks'
import { buildHomeStructuredData } from '@/lib/jsonLdSite'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_HOME` in `@/lib/cachePolicy` */
export const revalidate = 900

const HOME_TITLE = 'MegDB — Trending movies & TV, new releases and all-time favorites'
const HOME_DESCRIPTION =
  'English-first discovery: trending and new-release movie rails, acclaimed picks, best-of-2026, all-time film/TV charts, and popular actors — powered by TMDB metadata with fast search.'

/** Homepage-only SEO — overrides root `layout` title template for `/` */
export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: discoverPageAlternates('/'),
  ...discoverSocialMeta(HOME_TITLE, HOME_DESCRIPTION, '/'),
}

export default function HomePage() {
  const shelfAreaClass = typeof styles.page === 'string' ? styles.page : ''

  const structuredData = buildHomeStructuredData({
    pageName: HOME_TITLE,
    pageDescription: HOME_DESCRIPTION,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense fallback={null}>
        <HomeHeroSlot />
      </Suspense>

      <Suspense fallback={<HomeShelvesFallbackClient className={shelfAreaClass} />}>
        <HomeDiscoverShelves className={shelfAreaClass} />
      </Suspense>
    </>
  )
}

async function HomeHeroSlot() {
  const heroItems = await getHeroItems().catch(() => [])

  if (heroItems.length === 0) return null

  return (
    <>
      <HomeLcpPreloadLinks
        heroSlides={heroItems}
        shelfFallbacks={[]}
      />
      <HeroSection slides={heroItems} />
    </>
  )
}

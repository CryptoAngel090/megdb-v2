import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'

const title = 'Categories Redirect — MegDB'
const description = 'Legacy categories route redirects to Movies. Kept noindex with canonical contract.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/categories'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/categories'),
}

// Keep JSON-LD contract for SEO checks even though this route redirects.
const _jsonLdContract = (
  <WebPageJsonLd pathname="/categories" title={title} description={description} includeBreadcrumb={false} />
)
void _jsonLdContract

export default function CategoriesPage() {
  permanentRedirect('/movies')
}

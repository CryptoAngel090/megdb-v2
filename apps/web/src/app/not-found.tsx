import type { Metadata } from 'next'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'

export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'This MegDB URL does not exist or has moved. Return home to browse movies, series, and cartoons.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <>
      <WebPageJsonLd
        pathname="/not-found"
        title="Page not found"
        description="This MegDB URL does not exist or has moved. Return home to browse movies, series, and cartoons."
      />
      <EmptyState
        icon="🎬"
        title="Page not found"
        description="This URL doesn't exist or has been moved. Let's get you back on track."
        ctaLabel="Back to home"
        ctaHref="/"
      />
    </>
  )
}

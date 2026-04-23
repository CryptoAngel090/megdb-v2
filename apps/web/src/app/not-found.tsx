import type { Metadata } from 'next'
import { EmptyState } from '@/components/EmptyState/EmptyState'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <EmptyState
      icon="🎬"
      title="Page not found"
      description="This URL doesn't exist or has been moved. Let's get you back on track."
      ctaLabel="Back to home"
      ctaHref="/"
    />
  )
}

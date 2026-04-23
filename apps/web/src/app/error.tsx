'use client'

import { useEffect } from 'react'
import { EmptyState } from '@/components/EmptyState/EmptyState'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description="An unexpected error occurred. You can try again or return to the home page."
      ctaLabel="Try again"
      onCtaClick={reset}
    />
  )
}

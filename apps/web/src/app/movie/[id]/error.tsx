'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './error.module.css'

/**
 * Segment error boundary for `/movie/[id]` — same role as the old project’s movie error UI:
 * recoverable failures (e.g. TMDB/network) without a full app error page.
 */
export default function MovieDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[movie/[id]]', error)
  }, [error])

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.iconWrap} aria-hidden>
          <svg
            className={`${iconSlot.block} ${iconSlot.xl}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M10 9l4 3-4 3V9z" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 className={styles.title}>Couldn&apos;t load this movie</h1>
        <p className={styles.text}>
          Something went wrong while loading the page. You can try again or browse other titles.
        </p>
        {error.digest ? <p className={styles.digest}>Error ID: {error.digest}</p> : null}
        <div className={styles.actions}>
          <Button type="button" variant="primary" size="md" onClick={() => reset()}>
            <svg
              className={`${iconSlot.block} ${iconSlot.sm}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Try again
          </Button>
          <Link href="/movies" className={`${styles.btn} ${styles.btnGhost}`}>
            Browse movies
          </Link>
        </div>
      </div>
    </div>
  )
}

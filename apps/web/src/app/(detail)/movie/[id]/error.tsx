'use client'

import { useEffect } from 'react'
import styles from './error.module.css'

/**
 * Segment error boundary for `/movie/[id]` — minimal client surface to keep
 * the route’s client reference graph small (no `Link` / icon slot graph).
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
        <h1 className={styles.title}>Couldn&apos;t load this movie</h1>
        <p className={styles.text}>
          Something went wrong while loading the page. You can try again or browse other titles.
        </p>
        {error.digest ? <p className={styles.digest}>Error ID: {error.digest}</p> : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => reset()}
          >
            Try again
          </button>
          <a href="/movies" className={`${styles.btn} ${styles.btnGhost}`}>
            Browse movies
          </a>
        </div>
      </div>
    </div>
  )
}

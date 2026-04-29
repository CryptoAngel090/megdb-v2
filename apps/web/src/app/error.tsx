'use client'

import { useEffect } from 'react'
import styles from './error.module.css'

export default function GlobalError({
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
    <div className={styles.root} role="alert">
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.text}>
        An unexpected error occurred. You can try again or return to the home page.
      </p>
      <button type="button" className={styles.btn} onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}

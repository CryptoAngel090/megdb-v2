'use client'
// client: error boundaries must be client components

import hubStyles from '../hub.module.css'

export default function MoviesGenreAboutError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className={hubStyles.hub} aria-label="Genre guide error">
      <article className={hubStyles.teaserCard}>
        <h1 className={hubStyles.teaserTitle}>Unable to load this genre guide</h1>
        <p className={hubStyles.teaserText}>Try reloading this section.</p>
        <button type="button" onClick={reset} className={hubStyles.teaserAction}>
          Try again
        </button>
      </article>
    </section>
  )
}

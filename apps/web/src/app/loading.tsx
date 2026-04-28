import { MediaShelfSkeleton } from '@/components/MediaShelf/MediaShelf'
import styles from './loading.module.css'

/** Avoid `page.module.css` here — that sheet is homepage-specific; tying it to
 *  root `loading` caused missing layout CSS (e.g. footer) on unknown routes in dev. */
export default function Loading() {
  return (
    <div className={styles.root} aria-busy="true" aria-live="polite">
      <section className={styles.hero} aria-hidden="true">
        <div className={styles.heroTitle} />
        <div className={styles.heroMeta} />
      </section>
      <div className={styles.shelves} aria-hidden="true">
        <MediaShelfSkeleton count={7} />
        <MediaShelfSkeleton count={7} />
      </div>
    </div>
  )
}

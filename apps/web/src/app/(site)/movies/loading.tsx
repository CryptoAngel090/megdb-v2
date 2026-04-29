import styles from './loading.module.css'

export default function MoviesLoading() {
  return (
    <div className={styles.shell} aria-busy="true" aria-live="polite">
      <div className={styles.hero} aria-hidden />
      <div className={styles.filters} aria-hidden />
      <div className={styles.grid} aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.card} />
        ))}
      </div>
    </div>
  )
}

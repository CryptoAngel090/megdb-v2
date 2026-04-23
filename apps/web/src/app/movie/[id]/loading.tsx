import styles from './loading.module.css'

/** Route-level skeleton while `/movie/[id]` loads — mirrors old project’s dedicated movie loading UI. */
export default function MovieDetailLoading() {
  return (
    <div className={styles.root} aria-busy="true" aria-label="Loading movie">
      <div className={styles.hero}>
        <div className={styles.shimmer} />
      </div>
      <div className={styles.main}>
        <div>
          <div className={styles.lines}>
            <div className={styles.line} style={{ width: '40%', height: '18px' }} />
            <div className={`${styles.line} ${styles.lineMed}`} />
            <div className={`${styles.line} ${styles.lineShort}`} />
          </div>
          <div className={styles.trailerSk}>
            <div className={styles.shimmer} />
          </div>
        </div>
      </div>
      <div className={styles.castRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.castSk}>
            <div className={styles.castPhotoSk}>
              <div className={styles.shimmer} />
            </div>
            <div className={styles.castLine} style={{ width: '90%' }} />
            <div className={styles.castLine} style={{ width: '70%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

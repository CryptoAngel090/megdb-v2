import styles from './loading.module.css'

export default function SeriesDetailLoading() {
  return (
    <div className={styles.root} aria-busy="true" aria-label="Loading series">
      <div className={styles.hero}>
        <div className={styles.shimmer} />
      </div>
      <div className={styles.main}>
        <div className={styles.firstFold}>
          <div className={styles.posterSkWrap}>
            <div className={styles.posterSk}>
              <div className={styles.shimmer} />
            </div>
          </div>
          <div className={styles.summarySk}>
            <div className={`${styles.line} ${styles.lineTitle}`} />
            <div className={`${styles.line} ${styles.lineMeta}`} />
            <div className={`${styles.line} ${styles.lineBody}`} />
            <div className={`${styles.line} ${styles.lineBody} ${styles.lineBodyShort}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

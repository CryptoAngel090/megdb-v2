import styles from './BrowseSectionPage.module.css'

/** Simple shell for browse routes until listing pages are implemented. */
export function BrowseSectionPage({ title, description }: { title: string; description: string }) {
  return (
    <div className={`container ${styles.root}`}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{description}</p>
    </div>
  )
}

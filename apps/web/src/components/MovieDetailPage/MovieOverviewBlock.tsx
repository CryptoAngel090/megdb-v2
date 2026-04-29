import styles from './MovieOverviewBlock.module.css'

type MovieOverviewBlockProps = {
  text: string
}

export function MovieOverviewBlock({ text }: MovieOverviewBlockProps) {
  return (
    <div className={styles.root}>
      <p className={styles.overview}>{text}</p>
    </div>
  )
}

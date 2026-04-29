import { type DetailMediaKind, detailPathForMedia } from '@/lib/slug'
import type { MoviePageCardItem } from '@/lib/tmdb'
import styles from './MovieCollectionSection.module.css'
import { MovieSimilarRailCard } from './MovieSimilarRailCard'

type Props = {
  title: string
  parts: MoviePageCardItem[]
  mediaKind?: DetailMediaKind
}

export function MovieCollectionSection({ title, parts, mediaKind = 'movie' }: Props) {
  if (!parts.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleBar} aria-hidden />
          {title}
        </h2>
      </div>

      <div className={styles.trackWrap}>
        <div className={styles.track}>
          <div className={styles.inner}>
            {parts.map((m) => (
              <div key={m.id}>
                <MovieSimilarRailCard
                  item={m}
                  href={detailPathForMedia(mediaKind, m.title, m.releaseDate)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

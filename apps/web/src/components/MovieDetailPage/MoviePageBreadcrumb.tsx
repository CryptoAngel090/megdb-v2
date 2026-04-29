import Link from 'next/link'
import type { MoviePageDetail } from '@/lib/tmdb'
import styles from './MoviePageBreadcrumb.module.css'

interface MoviePageBreadcrumbProps {
  movie: MoviePageDetail
}

/** In-content trail — matches JSON-LD labels; not shown in header on `/movie/…`. */
export function MoviePageBreadcrumb({ movie }: MoviePageBreadcrumbProps) {
  const y =
    movie.releaseDate && movie.releaseDate.length >= 4
      ? Number(movie.releaseDate.slice(0, 4))
      : null
  const year = y != null && Number.isFinite(y) ? y : null
  const currentLabel = year ? `${movie.title} (${year})` : movie.title

  return (
    <nav className={styles.inlineBreadcrumb} aria-label="Breadcrumb">
      <ol className={styles.inlineBreadcrumbList}>
        <li className={styles.inlineBreadcrumbItem}>
          <Link href="/" className={styles.inlineBreadcrumbLink}>
            Home
          </Link>
        </li>
        <li className={styles.inlineBreadcrumbItem}>
          <Link href="/movies" className={styles.inlineBreadcrumbLink}>
            Movies
          </Link>
        </li>
        <li className={styles.inlineBreadcrumbItem}>
          <span className={styles.inlineBreadcrumbCurrent} aria-current="page">
            {currentLabel}
          </span>
        </li>
      </ol>
    </nav>
  )
}

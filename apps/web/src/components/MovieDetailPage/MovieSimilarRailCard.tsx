import Image from 'next/image'
import Link from 'next/link'
import type { MoviePageCardItem } from '@/lib/tmdb'
import { getImageUrl } from '@/lib/tmdb'
import styles from './MovieSimilarRailCard.module.css'

const POSTER_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

interface MovieSimilarRailCardProps {
  item: MoviePageCardItem
  href: string
}

function formatRuntimeMinutes(total: number): string {
  if (total < 60) return `${total}m`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Static discover tile for detail-page horizontal rails — replaces `MediaCard` here
 * so similar/collection shelves do not pull the interactive card client bundle.
 */
export function MovieSimilarRailCard({ item, href }: MovieSimilarRailCardProps) {
  const year =
    item.releaseDate && item.releaseDate.length >= 4 ? item.releaseDate.slice(0, 4) : null
  const posterSrc = item.posterPath ? getImageUrl(item.posterPath, 'w342') : ''
  const metaBits: string[] = []
  if (year) metaBits.push(year)
  if (item.voteAverage > 0) metaBits.push(`${item.voteAverage.toFixed(1)}★`)
  if (item.runtimeMinutes != null && item.runtimeMinutes > 0) {
    metaBits.push(formatRuntimeMinutes(item.runtimeMinutes))
  }
  const meta = metaBits.join(' · ')

  return (
    <Link
      href={href}
      className={styles.card}
      aria-label={`Open ${item.title}${year ? ` (${year})` : ''}`}
    >
      <div className={styles.posterWrap}>
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={`Poster for ${item.title}`}
            fill
            sizes="(max-width: 767px) 33vw, 22vw"
            className={styles.poster}
            placeholder="blur"
            blurDataURL={POSTER_BLUR}
          />
        ) : (
          <div className={styles.posterPlaceholder} aria-hidden />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{item.title}</p>
        {meta ? <p className={styles.meta}>{meta}</p> : null}
      </div>
    </Link>
  )
}

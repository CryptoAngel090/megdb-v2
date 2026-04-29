import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { jsonLdMainEntityId, jsonLdYoutubeVideoId } from '@/lib/jsonLdEntity'
import { getMoviePageDataShellCached } from '@/lib/moviePageDataCache'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { buildWatchSeoTitle } from '@/lib/seoTitles'
import { SITE_URL } from '@/lib/site'
import { moviePath } from '@/lib/slug'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

type Props = {
  params: Promise<{ id: string }>
}

function yearFromRelease(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null
  const y = Number(iso.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

const TRAILER_ROBOTS = { index: false, follow: true } as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const movieId = Number(id)
  const fallbackTitle = 'Trailer'
  const fallbackDesc = 'Watch a movie trailer clip on MegDB.'

  if (!Number.isFinite(movieId)) {
    const path = `/trailer/${encodeURIComponent(id)}`
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      robots: TRAILER_ROBOTS,
      alternates: discoverPageAlternates(path),
      ...discoverSocialMeta(fallbackTitle, fallbackDesc, path),
    }
  }
  const movie = await getMoviePageDataShellCached(movieId).catch(() => null)
  const path = `/trailer/${movieId}`
  if (!movie || !movie.trailerYoutubeKey) {
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      robots: TRAILER_ROBOTS,
      alternates: discoverPageAlternates(path),
      ...discoverSocialMeta(fallbackTitle, fallbackDesc, path),
    }
  }
  const y = yearFromRelease(movie.releaseDate)
  const title = buildWatchSeoTitle(movie.title, movie.releaseDate, 'trailer')
  const head = y ? `${movie.title} (${y}) — Trailer` : `${movie.title} — Trailer`
  const description = `Watch the trailer for ${movie.title}.`
  const thumb = `https://img.youtube.com/vi/${movie.trailerYoutubeKey}/maxresdefault.jpg`
  return {
    title,
    description,
    robots: TRAILER_ROBOTS,
    alternates: discoverPageAlternates(path),
    ...discoverSocialMeta(title, description, path, {
      type: 'video.other',
      images: [{ url: thumb, alt: head }],
    }),
  }
}

export default async function TrailerPage({ params }: Props) {
  const { id } = await params
  const movieId = Number(id)
  if (!Number.isFinite(movieId)) notFound()

  const movie = await getMoviePageDataShellCached(movieId)
  if (!movie) notFound()

  const key = movie.trailerYoutubeKey
  const movieHref = moviePath(movie.title, movie.releaseDate)

  if (!key) {
    return (
      <div className={styles.fallback}>
        <p>No trailer available.</p>
        <Link href={movieHref}>Back to movie</Link>
      </div>
    )
  }

  const y = yearFromRelease(movie.releaseDate)
  const trailerName = movie.trailer?.name ?? 'Trailer'
  const embedTitle = `${movie.title} — ${trailerName}`
  const movieCanonicalPath = moviePath(movie.title, movie.releaseDate)

  const videoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': jsonLdYoutubeVideoId(key),
    about: { '@id': jsonLdMainEntityId(movieCanonicalPath) },
    name: `${movie.title}${y ? ` (${y})` : ''} — ${trailerName}`,
    description: `Watch the trailer for ${movie.title}${y ? ` (${y})` : ''}.`.trim(),
    thumbnailUrl: [
      `https://img.youtube.com/vi/${key}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${key}/hqdefault.jpg`,
    ],
    uploadDate: movie.trailer?.publishedAt || undefined,
    embedUrl: `https://www.youtube.com/embed/${key}`,
    contentUrl: `https://www.youtube.com/watch?v=${key}`,
    publisher: { '@type': 'Organization', name: 'MegDB', url: SITE_URL },
    potentialAction: { '@type': 'WatchAction', target: `https://www.youtube.com/watch?v=${key}` },
  }

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />

      <div className={styles.embedWrap}>
        <div className={styles.aspect}>
          {/*
           * Same pattern as standalone trailer pages: no autoplay on load, simple `allow`,
           * `aspect-ratio` shell + absolute iframe — avoids the inline embed + layout edge cases.
           */}
          <iframe
            src={`https://www.youtube.com/embed/${key}?autoplay=0&rel=0`}
            title={embedTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.iframe}
          />
        </div>
      </div>

      <footer className={styles.footer}>
        <Link href={movieHref} className={styles.backLink}>
          ← Back to {movie.title}
        </Link>
      </footer>
    </div>
  )
}

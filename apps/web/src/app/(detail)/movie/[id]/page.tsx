import type { Metadata } from 'next'
import { Suspense, type CSSProperties } from 'react'
import { notFound, redirect } from 'next/navigation'
import { HeroLcpPreloadLinks } from '@/components/MovieDetailPage/HeroLcpPreloadLinks'
import { MovieDetailBelowFoldSuspenseFallback } from '@/components/MovieDetailPage/MovieDetailBelowFoldDynamics'
import { MovieDetailPage } from '@/components/MovieDetailPage/MovieDetailPage'
import { MovieDetailStreamedBelowFold } from '@/components/MovieDetailPage/MovieDetailStreamedBelowFold'
import { getMoviePageDataShellCached } from '@/lib/moviePageDataCache'
import { getImageUrl, getTopMovieIdsForStaticParams } from '@/lib/tmdb'
import type { MoviePageDetail } from '@/lib/tmdb'
import { jsonLdMainEntityId, jsonLdSameAsTmdb, jsonLdYoutubeVideoId } from '@/lib/jsonLdEntity'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { buildWatchSeoTitle } from '@/lib/seoTitles'
import { SITE_URL } from '@/lib/site'
import { moviePath, resolveMovieIdFromParam } from '@/lib/slug'
import { containsCyrillic } from '@/lib/textScript'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

/**
 * Pre-render the top 200 most popular movies at build time.
 * Converts these pages from Dynamic (ƒ) to ISR (●), eliminating cold-start
 * TTFB for the titles users are most likely to visit.
 * Less popular movies are still served on-demand and cached after first request.
 */
export async function generateStaticParams() {
  const ids = await getTopMovieIdsForStaticParams(200)
  return ids.map((id) => ({ id: String(id) }))
}

type Props = {
  params: Promise<{ id: string }>
}

type MoviePageCssVars = CSSProperties & Record<'--primary-color' | '--primary-rgb', string>

async function ensureMovieVisualMetadataOnFirstView(
  tmdbMovieId: number,
  tmdbBackdropPath: string | null
): Promise<void> {
  if (!tmdbBackdropPath) return

  const configuredApiBase = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!configuredApiBase) return

  const apiBase = configuredApiBase.replace(/\/+$/, '')
  const endpoint = `${apiBase}/api/movie-visuals/${tmdbMovieId}/ensure`

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbBackdropPath }),
      cache: 'no-store',
    })
  } catch {
    // First-view visual enrichment should never block page rendering.
    console.warn('[movie-page] ensure visual metadata skipped')
  }
}

function yearFromRelease(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null
  const y = Number(iso.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function normalizeHexColor(input: string | null | undefined): string {
  if (!input) return '#1a1a1a'
  const trimmed = input.trim()
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : '#1a1a1a'
}

function hexToRgb(hex: string): string {
  const safeHex = normalizeHexColor(hex)
  const r = Number.parseInt(safeHex.slice(1, 3), 16)
  const g = Number.parseInt(safeHex.slice(3, 5), 16)
  const b = Number.parseInt(safeHex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function buildJsonLdMovie(movie: MoviePageDetail, canonicalPath: string) {
  const posterUrl = movie.posterPath ? getImageUrl(movie.posterPath, 'w780') : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    '@id': jsonLdMainEntityId(canonicalPath),
    sameAs: jsonLdSameAsTmdb({ tmdbId: movie.id, media: 'movie', imdbId: movie.imdbId }),
    name: movie.title,
    description:
      movie.overview.trim() && !containsCyrillic(movie.overview) ? movie.overview : undefined,
    image: posterUrl || undefined,
    datePublished: movie.releaseDate || undefined,
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    aggregateRating:
      movie.voteAverage > 0 && movie.voteCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: movie.voteAverage.toFixed(1),
            bestRating: '10',
            ratingCount: movie.voteCount,
          }
        : undefined,
    genre: movie.genres.map((g) => g.name),
    inLanguage: movie.originalLanguage || undefined,
    url: `${SITE_URL}${canonicalPath}`,
    ...(movie.director ? { director: { '@type': 'Person', name: movie.director.name } } : {}),
    ...(movie.cast.length > 0
      ? { actor: movie.cast.slice(0, 8).map((a) => ({ '@type': 'Person', name: a.name })) }
      : {}),
    ...(movie.trailer ? { trailer: { '@id': jsonLdYoutubeVideoId(movie.trailer.key) } } : {}),
    ...(movie.justWatchLink
      ? {
          potentialAction: {
            '@type': 'WatchAction',
            target: { '@type': 'EntryPoint', urlTemplate: movie.justWatchLink },
          },
        }
      : {}),
  }
}

function buildBreadcrumb(movie: MoviePageDetail, canonicalPath: string) {
  const y = yearFromRelease(movie.releaseDate)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Movies', item: `${SITE_URL}/movies` },
      {
        '@type': 'ListItem',
        position: 3,
        name: y ? `${movie.title} (${y})` : movie.title,
        item: `${SITE_URL}${canonicalPath}`,
      },
    ],
  }
}

function buildVideoJsonLd(movie: MoviePageDetail, canonicalPath: string) {
  if (!movie.trailer) return null
  const y = yearFromRelease(movie.releaseDate)
  const { key, name, type, publishedAt } = movie.trailer
  const videoType = (type ?? 'Trailer').toLowerCase()
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': jsonLdYoutubeVideoId(key),
    about: { '@id': jsonLdMainEntityId(canonicalPath) },
    name: `${movie.title}${y ? ` (${y})` : ''} — ${name || 'Trailer'}`,
    description: `Watch the ${videoType} for ${movie.title}${y ? ` (${y})` : ''}.`.trim(),
    thumbnailUrl: [
      `https://img.youtube.com/vi/${key}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${key}/hqdefault.jpg`,
    ],
    uploadDate: publishedAt || undefined,
    embedUrl: `https://www.youtube.com/embed/${key}`,
    contentUrl: `https://www.youtube.com/watch?v=${key}`,
    publisher: { '@type': 'Organization', name: 'MegDB', url: SITE_URL },
    potentialAction: { '@type': 'WatchAction', target: `https://www.youtube.com/watch?v=${key}` },
  }
}

function buildFaqJsonLd(movie: MoviePageDetail) {
  const y = yearFromRelease(movie.releaseDate)
  const yt = y ? ` (${y})` : ''
  const streaming =
    movie.streamingNames.length > 0
      ? `${movie.title}${yt} is available to stream on ${movie.streamingNames.join(', ')} in supported regions. Availability may change as licenses update.`
      : `Streaming availability for ${movie.title}${yt} varies by region. Check major subscription services and digital rental stores.`

  const mainEntity: Record<string, unknown>[] = [
    {
      '@type': 'Question',
      name: `Where can I watch ${movie.title}?`,
      acceptedAnswer: { '@type': 'Answer', text: streaming },
    },
  ]
  if (movie.overview.trim() && !containsCyrillic(movie.overview)) {
    mainEntity.push({
      '@type': 'Question',
      name: `What is ${movie.title} about?`,
      acceptedAnswer: { '@type': 'Answer', text: movie.overview.slice(0, 500) },
    })
  }
  if (movie.director) {
    mainEntity.push({
      '@type': 'Question',
      name: `Who directed ${movie.title}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${movie.title}${yt} was directed by ${movie.director.name}.`,
      },
    })
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idStr } = await params
  const id = await resolveMovieIdFromParam(idStr)
  if (id == null) {
    return {
      title: 'Movie',
      description: 'Browse movies, trailers, and streaming context on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const data = await getMoviePageDataShellCached(id)
  if (!data) {
    return {
      title: 'Not found',
      description: 'This movie page is unavailable on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const canonicalPath = moviePath(data.title, data.releaseDate)
  const ov = data.overview.trim()
  const description =
    ov && !containsCyrillic(ov)
      ? ov.slice(0, 155) + (ov.length > 155 ? '…' : '')
      : `${data.title} — movies on MegDB`
  const title = buildWatchSeoTitle(data.title, data.releaseDate, 'movie')
  const ogImage = data.posterPath ? getImageUrl(data.posterPath, 'w780') : undefined
  return {
    title,
    description,
    alternates: discoverPageAlternates(canonicalPath),
    ...discoverSocialMeta(data.title, description, canonicalPath, {
      type: 'video.movie',
      ...(data.releaseDate ? { releaseDate: data.releaseDate } : {}),
      ...(ogImage ? { images: [{ url: ogImage, width: 780, height: 1170, alt: data.title }] } : {}),
    }),
  }
}

export default async function MoviePage({ params }: Props) {
  const { id: idStr } = await params
  const id = await resolveMovieIdFromParam(idStr)
  if (id == null) {
    notFound()
  }
  const data = await getMoviePageDataShellCached(id)
  if (!data) {
    notFound()
  }

  const canonicalPath = moviePath(data.title, data.releaseDate)
  if (`/movie/${idStr}` !== canonicalPath) {
    redirect(canonicalPath)
  }

  if (process.env.NODE_ENV !== 'production') {
    await ensureMovieVisualMetadataOnFirstView(data.id, data.backdropPath)
  }

  const jsonLd = buildJsonLdMovie(data, canonicalPath)
  const breadcrumb = buildBreadcrumb(data, canonicalPath)
  const faqLd = buildFaqJsonLd(data)
  const videoLd = buildVideoJsonLd(data, canonicalPath)
  const primaryColorHex = normalizeHexColor(data.primaryColor)
  const pageCssVars: MoviePageCssVars = {
    '--primary-color': primaryColorHex,
    '--primary-rgb': hexToRgb(primaryColorHex),
  }
  const tailInput = {
    mediaId: data.id,
    genreIds: data.genres.map((g) => g.id),
    releaseYear: yearFromRelease(data.releaseDate),
    collectionTmdbId: data.belongsToCollectionMeta?.id ?? null,
  }

  return (
    <div className={styles.page} style={pageCssVars}>
      <HeroLcpPreloadLinks posterPath={data.posterPath} backdropPath={data.backdropPath} />
      <link rel="preconnect" href="https://www.youtube.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.youtube-nocookie.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {videoLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
        />
      )}
      <MovieDetailPage
        key={data.id}
        movie={data}
        streamedBelowFold={
          <Suspense fallback={<MovieDetailBelowFoldSuspenseFallback />}>
            <MovieDetailStreamedBelowFold
              tailInput={tailInput}
              similarMediaKind="movie"
              movieTitle={data.title}
              cast={data.cast}
            />
          </Suspense>
        }
      />
    </div>
  )
}

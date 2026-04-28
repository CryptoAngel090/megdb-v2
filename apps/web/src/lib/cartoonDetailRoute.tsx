import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { HeroLcpPreloadLinks } from '@/components/MovieDetailPage/HeroLcpPreloadLinks'
import { MovieDetailBelowFoldSuspenseFallback } from '@/components/MovieDetailPage/MovieDetailBelowFoldDynamics'
import {
  MovieDetailPage,
  type MovieDetailPageNav,
} from '@/components/MovieDetailPage/MovieDetailPage'
import { MovieDetailStreamedBelowFold } from '@/components/MovieDetailPage/MovieDetailStreamedBelowFold'
import { getMoviePageDataShellCached } from '@/lib/moviePageDataCache'
import { getImageUrl, type MoviePageDetail } from '@/lib/tmdb'
import { jsonLdMainEntityId, jsonLdSameAsTmdb, jsonLdYoutubeVideoId } from '@/lib/jsonLdEntity'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { buildWatchSeoTitle } from '@/lib/seoTitles'
import { SITE_URL } from '@/lib/site'
import { cartoonPath, resolveMovieIdFromParam } from '@/lib/slug'
import { containsCyrillic } from '@/lib/textScript'

const cartoonNav: MovieDetailPageNav = {
  backHref: '/cartoons',
  backLabel: 'All Cartoons',
  genreQueryPrefix: '/cartoons?genre=',
  similarMediaKind: 'cartoon',
}

type Props = {
  params: Promise<{ id: string }>
}

function yearFromRelease(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null
  const y = Number(iso.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function buildJsonLdCartoon(movie: MoviePageDetail, canonicalPath: string) {
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
      { '@type': 'ListItem', position: 2, name: 'Cartoons', item: `${SITE_URL}/cartoons` },
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

export async function generateCartoonDetailMetadata({ params }: Props): Promise<Metadata> {
  const { id: idStr } = await params
  const id = await resolveMovieIdFromParam(idStr)
  if (id == null) {
    return {
      title: 'Cartoon',
      description: 'Browse animated movies and cartoons on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const data = await getMoviePageDataShellCached(id)
  if (!data) {
    return {
      title: 'Not found',
      description: 'This cartoon page is unavailable on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const canonicalPath = cartoonPath(data.title, data.releaseDate)
  const ov = data.overview.trim()
  const description =
    ov && !containsCyrillic(ov)
      ? ov.slice(0, 155) + (ov.length > 155 ? '…' : '')
      : `${data.title} — cartoons on MegDB`
  const ogImage = data.posterPath ? getImageUrl(data.posterPath, 'w780') : undefined
  const title = buildWatchSeoTitle(data.title, data.releaseDate, 'movie')
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

export async function CartoonDetailPageApp({ params }: Props) {
  const { id: idStr } = await params
  const id = await resolveMovieIdFromParam(idStr)
  if (id == null) {
    notFound()
  }
  const data = await getMoviePageDataShellCached(id)
  if (!data) {
    notFound()
  }

  const canonicalPath = cartoonPath(data.title, data.releaseDate)
  if (`/cartoon/${idStr}` !== canonicalPath) {
    redirect(canonicalPath)
  }

  const jsonLd = buildJsonLdCartoon(data, canonicalPath)
  const breadcrumb = buildBreadcrumb(data, canonicalPath)
  const faqLd = buildFaqJsonLd(data)
  const videoLd = buildVideoJsonLd(data, canonicalPath)

  const tailInput = {
    mediaId: data.id,
    genreIds: data.genres.map((g) => g.id),
    releaseYear: yearFromRelease(data.releaseDate),
    collectionTmdbId: data.belongsToCollectionMeta?.id ?? null,
  }

  return (
    <>
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
        nav={cartoonNav}
        streamedBelowFold={
          <Suspense fallback={<MovieDetailBelowFoldSuspenseFallback />}>
            <MovieDetailStreamedBelowFold
              tailInput={tailInput}
              similarMediaKind="cartoon"
              movieTitle={data.title}
              cast={data.cast}
              variant="movie"
            />
          </Suspense>
        }
      />
    </>
  )
}

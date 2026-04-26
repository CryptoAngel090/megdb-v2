import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { HeroLcpPreloadLinks } from '@/components/MovieDetailPage/HeroLcpPreloadLinks'
import {
  MovieDetailPage,
  type MovieDetailPageNav,
} from '@/components/MovieDetailPage/MovieDetailPage'
import { getImageUrl, getTvPageData, type MoviePageDetail } from '@/lib/tmdb'
import { SITE_URL } from '@/lib/site'
import { resolveTvSeriesIdFromParam, seriesPath, tvshowPath } from '@/lib/slug'
import { containsCyrillic } from '@/lib/textScript'

/** ISR window (seconds). Detail `page.tsx` files must use the same numeric literal for `export const revalidate`. */
export const TV_SERIES_DETAIL_REVALIDATE = 3600

export type TvSeriesRouteSegment = 'series' | 'tvshow' | 'tvshows'

type Props = {
  params: Promise<{ id: string }>
}

function pathForSegment(
  segment: TvSeriesRouteSegment,
  title: string,
  firstAir: string | null
): string {
  if (segment === 'series') return seriesPath(title, firstAir)
  if (segment === 'tvshows') {
    const canonical = tvshowPath(title, firstAir)
    return canonical.startsWith('/tvshow/')
      ? `/tvshows/${canonical.slice('/tvshow/'.length)}`
      : canonical
  }
  return tvshowPath(title, firstAir)
}

function navForSegment(segment: TvSeriesRouteSegment): MovieDetailPageNav {
  if (segment === 'series') {
    return {
      backHref: '/series',
      backLabel: 'All Series',
      genreQueryPrefix: '/series?genre=',
      similarMediaKind: 'series',
      showBoxOffice: false,
      feedbackScope: 'tv',
    }
  }
  if (segment === 'tvshows') {
    return {
      backHref: '/tvshows',
      backLabel: 'All TV Shows',
      genreQueryPrefix: '/tvshows?genre=',
      similarMediaKind: 'tvshow',
      showBoxOffice: false,
      feedbackScope: 'tv',
    }
  }
  return {
    backHref: '/tvshows',
    backLabel: 'All TV Shows',
    genreQueryPrefix: '/tvshows?genre=',
    similarMediaKind: 'tvshow',
    showBoxOffice: false,
    feedbackScope: 'tv',
  }
}

function yearFromFirstAir(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null
  const y = Number(iso.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function buildJsonLdTv(show: MoviePageDetail, canonicalPath: string) {
  const posterUrl = show.posterPath ? getImageUrl(show.posterPath, 'w780') : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.title,
    description:
      show.overview.trim() && !containsCyrillic(show.overview) ? show.overview : undefined,
    image: posterUrl || undefined,
    datePublished: show.releaseDate || undefined,
    aggregateRating:
      show.voteAverage > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: show.voteAverage.toFixed(1),
            bestRating: '10',
            ratingCount: show.voteCount,
          }
        : undefined,
    genre: show.genres.map((g) => g.name),
    inLanguage: show.originalLanguage || undefined,
    url: `${SITE_URL}${canonicalPath}`,
    ...(show.director ? { creator: { '@type': 'Person', name: show.director.name } } : {}),
    ...(show.cast.length > 0
      ? { actor: show.cast.slice(0, 8).map((a) => ({ '@type': 'Person', name: a.name })) }
      : {}),
    ...(show.trailer ? { trailer: { '@id': `${SITE_URL}/trailer/${show.id}#video` } } : {}),
    ...(show.justWatchLink
      ? {
          potentialAction: {
            '@type': 'WatchAction',
            target: { '@type': 'EntryPoint', urlTemplate: show.justWatchLink },
          },
        }
      : {
          potentialAction: {
            '@type': 'WatchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}${canonicalPath}` },
          },
        }),
  }
}

function buildBreadcrumb(
  show: MoviePageDetail,
  canonicalPath: string,
  segment: TvSeriesRouteSegment
) {
  const y = yearFromFirstAir(show.releaseDate)
  const hubName = segment === 'series' ? 'Series' : 'TV Shows'
  const hubPath = segment === 'series' ? '/series' : '/tvshows'
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: hubName, item: `${SITE_URL}${hubPath}` },
      {
        '@type': 'ListItem',
        position: 3,
        name: y ? `${show.title} (${y})` : show.title,
        item: `${SITE_URL}${canonicalPath}`,
      },
    ],
  }
}

function buildVideoJsonLd(show: MoviePageDetail) {
  if (!show.trailer) return null
  const y = yearFromFirstAir(show.releaseDate)
  const { key, name, type, publishedAt } = show.trailer
  const videoType = (type ?? 'Trailer').toLowerCase()
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${SITE_URL}/trailer/${show.id}#video`,
    name: `${show.title}${y ? ` (${y})` : ''} — ${name || 'Trailer'}`,
    description: `Watch the ${videoType} for ${show.title}${y ? ` (${y})` : ''}.`.trim(),
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

function buildFaqJsonLd(show: MoviePageDetail) {
  const y = yearFromFirstAir(show.releaseDate)
  const yt = y ? ` (${y})` : ''
  const streaming =
    show.streamingNames.length > 0
      ? `${show.title}${yt} is available to stream on ${show.streamingNames.join(', ')} in supported regions. Availability may change as licenses update.`
      : `Streaming availability for ${show.title}${yt} varies by region. Check major subscription services and digital rental stores.`

  const mainEntity: Record<string, unknown>[] = [
    {
      '@type': 'Question',
      name: `Where can I watch ${show.title}?`,
      acceptedAnswer: { '@type': 'Answer', text: streaming },
    },
  ]
  if (show.overview.trim() && !containsCyrillic(show.overview)) {
    mainEntity.push({
      '@type': 'Question',
      name: `What is ${show.title} about?`,
      acceptedAnswer: { '@type': 'Answer', text: show.overview.slice(0, 500) },
    })
  }
  if (show.director) {
    mainEntity.push({
      '@type': 'Question',
      name: `Who created ${show.title}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${show.title}${yt} — ${show.director.name} is listed among key credits.`,
      },
    })
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}

export async function generateTvSeriesDetailMetadata(
  { params }: Props,
  segment: TvSeriesRouteSegment
): Promise<Metadata> {
  const { id: idStr } = await params
  const id = await resolveTvSeriesIdFromParam(idStr)
  if (id == null) {
    return { title: 'Series' }
  }
  const data = await getTvPageData(id)
  if (!data) {
    return { title: 'Not found' }
  }
  const canonicalPath = pathForSegment(segment, data.title, data.releaseDate)
  const ov = data.overview.trim()
  const description =
    ov && !containsCyrillic(ov)
      ? ov.slice(0, 155) + (ov.length > 155 ? '…' : '')
      : `${data.title} — TV on MegDB`
  const ogImage = data.posterPath ? getImageUrl(data.posterPath, 'w780') : undefined
  return {
    title: data.title,
    description,
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
    openGraph: {
      title: data.title,
      description,
      type: 'video.tv_show',
      ...(data.releaseDate ? { releaseDate: data.releaseDate } : {}),
      images: ogImage ? [{ url: ogImage, width: 780, height: 1170, alt: data.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export async function TvSeriesDetailPageApp({ params }: Props, segment: TvSeriesRouteSegment) {
  const { id: idStr } = await params
  const id = await resolveTvSeriesIdFromParam(idStr)
  if (id == null) {
    notFound()
  }
  const data = await getTvPageData(id)
  if (!data) {
    notFound()
  }

  const canonicalPath = pathForSegment(segment, data.title, data.releaseDate)
  const baseSegment =
    segment === 'series' ? '/series' : segment === 'tvshows' ? '/tvshows' : '/tvshow'
  if (`${baseSegment}/${idStr}` !== canonicalPath) {
    redirect(canonicalPath)
  }

  const jsonLd = buildJsonLdTv(data, canonicalPath)
  const breadcrumb = buildBreadcrumb(data, canonicalPath, segment)
  const faqLd = buildFaqJsonLd(data)
  const videoLd = buildVideoJsonLd(data)

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
      <MovieDetailPage key={data.id} movie={data} nav={navForSegment(segment)} />
    </>
  )
}

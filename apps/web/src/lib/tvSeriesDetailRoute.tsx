import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import { HeroLcpPreloadLinks } from '@/components/MovieDetailPage/HeroLcpPreloadLinks'
import { MovieDetailBelowFoldSuspenseFallback } from '@/components/MovieDetailPage/MovieDetailBelowFoldDynamics'
import {
  MovieDetailPage,
  type MovieDetailPageNav,
} from '@/components/MovieDetailPage/MovieDetailPage'
import { MovieDetailStreamedBelowFold } from '@/components/MovieDetailPage/MovieDetailStreamedBelowFold'
import { getTvPageDataShellCached } from '@/lib/moviePageDataCache'
import { getImageUrl, type MoviePageDetail } from '@/lib/tmdb'
import { jsonLdMainEntityId, jsonLdSameAsTmdb, jsonLdYoutubeVideoId } from '@/lib/jsonLdEntity'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { buildWatchSeoTitle } from '@/lib/seoTitles'
import { SITE_URL } from '@/lib/site'
import { resolveTvSeriesIdFromParam, seriesPath } from '@/lib/slug'
import { containsCyrillic } from '@/lib/textScript'

type TvSeriesRouteSegment = 'series' | 'tvshow' | 'tvshows'

type Props = {
  params: Promise<{ id: string }>
}

/** Detail render runs only after non-`series` segments redirect to `/series/…`. */
function navForSeriesDetail(): MovieDetailPageNav {
  return {
    backHref: '/series',
    backLabel: 'All Series',
    genreQueryPrefix: '/series?genre=',
    similarMediaKind: 'series',
    showBoxOffice: false,
    feedbackScope: 'tv',
  }
}

function yearFromFirstAir(iso: string | null): number | null {
  if (!iso || iso.length < 4) return null
  const y = Number(iso.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function tvSeasonsJsonLd(show: MoviePageDetail, canonicalPath: string): Record<string, unknown>[] {
  const rows = show.tvSeasonSummaries
  if (!rows?.length) return []
  const seriesId = jsonLdMainEntityId(canonicalPath)
  return rows.map((s) => ({
    '@type': 'TVSeason',
    '@id': `${SITE_URL}${canonicalPath}#season-${s.seasonNumber}`,
    seasonNumber: s.seasonNumber,
    name: s.name,
    ...(s.episodeCount > 0 ? { numberOfEpisodes: s.episodeCount } : {}),
    ...(s.airDate ? { datePublished: s.airDate } : {}),
    partOfSeries: { '@id': seriesId },
  }))
}

function buildJsonLdTv(show: MoviePageDetail, canonicalPath: string) {
  const posterUrl = show.posterPath ? getImageUrl(show.posterPath, 'w780') : undefined
  const seasonsLd = tvSeasonsJsonLd(show, canonicalPath)
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    '@id': jsonLdMainEntityId(canonicalPath),
    sameAs: jsonLdSameAsTmdb({ tmdbId: show.id, media: 'tv', imdbId: show.imdbId }),
    name: show.title,
    description:
      show.overview.trim() && !containsCyrillic(show.overview) ? show.overview : undefined,
    image: posterUrl || undefined,
    datePublished: show.releaseDate || undefined,
    aggregateRating:
      show.voteAverage > 0 && show.voteCount > 0
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
    ...(show.trailer ? { trailer: { '@id': jsonLdYoutubeVideoId(show.trailer.key) } } : {}),
    ...(seasonsLd.length > 0 ? { containsSeason: seasonsLd } : {}),
    ...(show.justWatchLink
      ? {
          potentialAction: {
            '@type': 'WatchAction',
            target: { '@type': 'EntryPoint', urlTemplate: show.justWatchLink },
          },
        }
      : {}),
  }
}

function buildBreadcrumb(show: MoviePageDetail, canonicalPath: string) {
  const y = yearFromFirstAir(show.releaseDate)
  const hubName = 'Series'
  const hubPath = '/series'
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

function buildVideoJsonLd(show: MoviePageDetail, canonicalPath: string) {
  if (!show.trailer) return null
  const y = yearFromFirstAir(show.releaseDate)
  const { key, name, type, publishedAt } = show.trailer
  const videoType = (type ?? 'Trailer').toLowerCase()
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': jsonLdYoutubeVideoId(key),
    about: { '@id': jsonLdMainEntityId(canonicalPath) },
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
    return {
      title: 'Series',
      description: 'Browse TV series, episodes, and trailers on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  const data = await getTvPageDataShellCached(id)
  if (!data) {
    return {
      title: 'Not found',
      description: 'This TV series page is unavailable on MegDB.',
      robots: { index: false, follow: true },
    }
  }
  if (segment !== 'series') {
    permanentRedirect(seriesPath(data.title, data.releaseDate))
  }
  const canonicalPath = seriesPath(data.title, data.releaseDate)
  const ov = data.overview.trim()
  const description =
    ov && !containsCyrillic(ov)
      ? ov.slice(0, 155) + (ov.length > 155 ? '…' : '')
      : `${data.title} — TV on MegDB`
  const ogImage = data.posterPath ? getImageUrl(data.posterPath, 'w780') : undefined
  const title = buildWatchSeoTitle(data.title, data.releaseDate, 'series')
  return {
    title,
    description,
    alternates: discoverPageAlternates(canonicalPath),
    ...discoverSocialMeta(data.title, description, canonicalPath, {
      type: 'video.tv_show',
      ...(data.releaseDate ? { releaseDate: data.releaseDate } : {}),
      ...(ogImage ? { images: [{ url: ogImage, width: 780, height: 1170, alt: data.title }] } : {}),
    }),
  }
}

export async function TvSeriesDetailPageApp({ params }: Props, segment: TvSeriesRouteSegment) {
  const { id: idStr } = await params
  const id = await resolveTvSeriesIdFromParam(idStr)
  if (id == null) {
    notFound()
  }
  const data = await getTvPageDataShellCached(id)
  if (!data) {
    notFound()
  }

  if (segment !== 'series') {
    permanentRedirect(seriesPath(data.title, data.releaseDate))
  }

  const canonicalPath = seriesPath(data.title, data.releaseDate)
  if (`/series/${idStr}` !== canonicalPath) {
    permanentRedirect(canonicalPath)
  }

  const jsonLd = buildJsonLdTv(data, canonicalPath)
  const breadcrumb = buildBreadcrumb(data, canonicalPath)
  const faqLd = buildFaqJsonLd(data)
  const videoLd = buildVideoJsonLd(data, canonicalPath)

  const tailInput = {
    mediaId: data.id,
    genreIds: data.genres.map((g) => g.id),
    releaseYear: yearFromFirstAir(data.releaseDate),
    collectionTmdbId: null,
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
        nav={navForSeriesDetail()}
        streamedBelowFold={
          <Suspense fallback={<MovieDetailBelowFoldSuspenseFallback />}>
            <MovieDetailStreamedBelowFold
              tailInput={tailInput}
              similarMediaKind="series"
              movieTitle={data.title}
              cast={data.cast}
              variant="tv"
            />
          </Suspense>
        }
      />
    </>
  )
}

import { getImageUrl } from '@/lib/tmdb'

type Props = {
  posterPath: string | null
  backdropPath: string | null
}

/**
 * Early hints for hero LCP: mobile uses poster (`w500`), desktop uses backdrop (`original`),
 * matching `MovieDetailPage` hero layers and the 48rem breakpoint.
 */
export function HeroLcpPreloadLinks({ posterPath, backdropPath }: Props) {
  const poster = posterPath ? getImageUrl(posterPath, 'w500') : null
  const backdrop = backdropPath ? getImageUrl(backdropPath, 'original') : null

  if (poster && backdrop) {
    return (
      <>
        <link
          rel="preload"
          as="image"
          href={poster}
          fetchPriority="high"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          as="image"
          href={backdrop}
          fetchPriority="high"
          media="(min-width: 768px)"
        />
      </>
    )
  }

  if (poster) {
    return <link rel="preload" as="image" href={poster} fetchPriority="high" />
  }

  if (backdrop) {
    return <link rel="preload" as="image" href={backdrop} fetchPriority="high" />
  }

  return null
}

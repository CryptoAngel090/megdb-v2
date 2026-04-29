import type { Metadata } from 'next'
import { RandomMoviePage } from '@/components/RandomMoviePage/RandomMoviePage'
import { WebPageJsonLd } from '@/components/WebPageJsonLd/WebPageJsonLd'
import { discoverPageAlternates, discoverSocialMeta } from '@/lib/seoSocial'
import { getMovieGenresList } from '@/lib/tmdb'

const title = 'Random Movie — MegDB'
const description =
  'Random movie picker: MegDB suggests a TMDB-backed theatrical or streaming title — filter by genre, decade, and minimum rating before you spin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: discoverPageAlternates('/movies/random'),
  robots: { index: false, follow: true },
  ...discoverSocialMeta(title, description, '/movies/random'),
}

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

export default async function RandomMovieRoute() {
  const genres = await getMovieGenresList().catch(() => [])
  return (
    <>
      <WebPageJsonLd pathname="/movies/random" title={title} description={description} />
      <RandomMoviePage genres={genres} />
    </>
  )
}

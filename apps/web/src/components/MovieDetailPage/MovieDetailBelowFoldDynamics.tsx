import dynamic from 'next/dynamic'
import styles from './MovieDetailPage.module.css'

function DetailLazyFallback() {
  return <div className={styles.lazySection} aria-hidden />
}

export function MovieDetailBelowFoldSuspenseFallback() {
  return (
    <div className={styles.belowFoldStreamFallback} aria-hidden>
      <div className={styles.belowFoldStreamFallbackInner} />
    </div>
  )
}

export const MovieTrailerBlockLazy = dynamic(
  () => import('./MovieTrailerBlock').then((m) => m.MovieTrailerBlock),
  { loading: DetailLazyFallback },
)
export const MoviePhotosSectionLazy = dynamic(
  () => import('./MoviePhotosSection').then((m) => m.MoviePhotosSection),
  { loading: DetailLazyFallback },
)
export const MovieCastSectionLazy = dynamic(
  () => import('./MovieCastSection').then((m) => m.MovieCastSection),
  { loading: DetailLazyFallback },
)
export const MovieFaqAccordionLazy = dynamic(
  () => import('./MovieFaqAccordion').then((m) => m.MovieFaqAccordion),
  { loading: DetailLazyFallback },
)
export const MovieCollectionSectionLazy = dynamic(
  () => import('./MovieCollectionSection').then((m) => m.MovieCollectionSection),
  { loading: DetailLazyFallback },
)
export const TvSeriesEpisodesLazy = dynamic(
  () => import('@/components/TvSeriesEpisodes/TvSeriesEpisodes').then((m) => m.TvSeriesEpisodes),
  { loading: DetailLazyFallback },
)

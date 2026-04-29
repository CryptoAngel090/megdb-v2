import dynamic from 'next/dynamic'
import styles from './MovieDetailPage.module.css'

function DetailLazyFallback() {
  return <div className={styles.lazySection} aria-hidden />
}

export const TvSeriesEpisodesLazy = dynamic(
  () => import('@/components/TvSeriesEpisodes/TvSeriesEpisodes').then((m) => m.TvSeriesEpisodes),
  { loading: DetailLazyFallback }
)

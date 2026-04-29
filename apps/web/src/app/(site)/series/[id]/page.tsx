import { getTopSeriesIdsForStaticParams } from '@/lib/tmdb'
import { generateTvSeriesDetailMetadata, TvSeriesDetailPageApp } from '@/lib/tvSeriesDetailRoute'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

/**
 * Pre-render the top 200 most popular TV series at build time.
 * Converts these pages from Dynamic (ƒ) to ISR (●), eliminating cold-start
 * TTFB for the titles users are most likely to visit.
 */
export async function generateStaticParams() {
  const ids = await getTopSeriesIdsForStaticParams(200)
  return ids.map((id) => ({ id: String(id) }))
}

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props) {
  return generateTvSeriesDetailMetadata(props, 'series')
}

export default async function SeriesDetailPage(props: Props) {
  return <div className={styles.page}>{await TvSeriesDetailPageApp(props, 'series')}</div>
}

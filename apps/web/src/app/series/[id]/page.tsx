import { TvSeriesDetailPageApp, generateTvSeriesDetailMetadata } from '@/lib/tvSeriesDetailRoute'
import styles from './page.module.css'

/** Must match `TV_SERIES_DETAIL_REVALIDATE`; Next.js only accepts a literal here. */
export const revalidate = 3600

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props) {
  return generateTvSeriesDetailMetadata(props, 'series')
}

export default async function SeriesDetailPage(props: Props) {
  return <div className={styles.page}>{await TvSeriesDetailPageApp(props, 'series')}</div>
}

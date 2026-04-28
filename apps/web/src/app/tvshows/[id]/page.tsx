import { TvSeriesDetailPageApp, generateTvSeriesDetailMetadata } from '@/lib/tvSeriesDetailRoute'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props) {
  return generateTvSeriesDetailMetadata(props, 'tvshows')
}

export default async function TvshowsDetailPage(props: Props) {
  return <div className={styles.page}>{await TvSeriesDetailPageApp(props, 'tvshows')}</div>
}

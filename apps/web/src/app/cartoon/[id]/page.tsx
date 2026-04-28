import { CartoonDetailPageApp, generateCartoonDetailMetadata } from '@/lib/cartoonDetailRoute'
import styles from './page.module.css'

/** @sync `ROUTE_REVALIDATE_MEDIA_DETAIL` in `@/lib/cachePolicy` */
export const revalidate = 3600

export const generateMetadata = generateCartoonDetailMetadata

type Props = { params: Promise<{ id: string }> }

export default async function CartoonDetailPage(props: Props) {
  return <div className={styles.page}>{await CartoonDetailPageApp(props)}</div>
}

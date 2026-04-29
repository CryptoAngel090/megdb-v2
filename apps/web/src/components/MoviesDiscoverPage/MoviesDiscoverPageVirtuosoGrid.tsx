import { type ComponentProps, forwardRef } from 'react'
import styles from './MoviesDiscoverPage.module.css'

export const VirtuosoGridList = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => {
  const className = props.className ? `${styles.grid} ${props.className}` : styles.grid
  return <div {...props} ref={ref} className={className} />
})

VirtuosoGridList.displayName = 'VirtuosoGridList'

export function VirtuosoGridItem(props: ComponentProps<'div'>) {
  const className = props.className ? `${styles.gridItem} ${props.className}` : styles.gridItem
  return <div {...props} className={className} />
}

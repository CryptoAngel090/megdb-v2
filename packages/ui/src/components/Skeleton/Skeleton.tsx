import styles from './Skeleton.module.css'

interface SkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'avatar' | 'badge' | 'custom'
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ variant = 'custom', width, height, className }: SkeletonProps) {
  const classes = [styles.skeleton, variant !== 'custom' && styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return <div className={classes} style={{ width, height }} aria-hidden="true" />
}

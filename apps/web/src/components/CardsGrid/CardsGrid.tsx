import type { ReactNode } from 'react'
import { gridColumnClasses, gridGapClasses } from '@/classes'
import type { GridColumnKey, GridGapKey } from '@/theme/tokens/size'

interface CardsGridProps {
  children: ReactNode
  columns?: GridColumnKey
  gap?: GridGapKey
  className?: string
}

/**
 * Semantic grid wrapper for card layouts.
 * Example defaults: `gap-md` + `grid-cols-layout-md`.
 */
export function CardsGrid({
  children,
  columns = 'md',
  gap = 'md',
  className,
}: CardsGridProps) {
  const classes = ['grid', gridGapClasses[gap], gridColumnClasses[columns], className]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}

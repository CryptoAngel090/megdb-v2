import type { ReactNode } from 'react'

interface FadeInViewProps {
  children: ReactNode
  className?: string
  /** Not used — kept for API compatibility */
  delay?: number
  y?: number
  duration?: number
  as?: 'div' | 'section' | 'article' | 'li' | 'span'
}

/** Optional `.reveal` hook — global styles keep content visible (no scroll-timeline). */
export function FadeInView({ children, className, as: Tag = 'div' }: FadeInViewProps) {
  return <Tag className={`${className ?? ''} reveal`.trim()}>{children}</Tag>
}

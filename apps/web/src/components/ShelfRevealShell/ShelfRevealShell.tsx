'use client'

import type { ReactNode } from 'react'

type ShelfRevealShellProps = {
  outerClassName?: string | undefined
  innerClassName: string | undefined
  'aria-labelledby': string
  children: ReactNode
}

/** Semantic section wrapper for horizontal shelves (aria-labelledby + inner layout). */
export function ShelfRevealShell({
  outerClassName,
  innerClassName,
  'aria-labelledby': ariaLabelledBy,
  children,
}: ShelfRevealShellProps) {
  return (
    <section className={outerClassName ?? ''} aria-labelledby={ariaLabelledBy}>
      <div className={innerClassName ?? ''}>{children}</div>
    </section>
  )
}

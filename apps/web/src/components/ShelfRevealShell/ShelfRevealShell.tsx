'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { shelfInViewOptions, shelfSectionRevealVariants } from '@/lib/shelfAnimations'

type ShelfRevealShellProps = {
  /** Ref target for `useInView` — keep this wrapper out of opacity animations. */
  outerClassName?: string | undefined
  /** CSS module token — may be `string | undefined` under `exactOptionalPropertyTypes`. */
  innerClassName: string | undefined
  'aria-labelledby': string
  reduceMotion: boolean
  children: ReactNode
}

/**
 * Scroll-in reveal for homepage rails: opaque `<section>` + inner `motion.div`.
 * Centralizes the IO / opacity pitfall (never observe a fully transparent node).
 */
export function ShelfRevealShell({
  outerClassName,
  innerClassName,
  'aria-labelledby': ariaLabelledBy,
  reduceMotion,
  children,
}: ShelfRevealShellProps) {
  const shelfRef = useRef<HTMLElement | null>(null)
  const shelfInView = useInView(shelfRef, shelfInViewOptions)

  return (
    <section ref={shelfRef} className={outerClassName} aria-labelledby={ariaLabelledBy}>
      {reduceMotion ? (
        <div className={innerClassName ?? ''}>{children}</div>
      ) : (
        <motion.div
          className={innerClassName ?? ''}
          variants={shelfSectionRevealVariants}
          initial="hidden"
          animate={shelfInView ? 'visible' : 'hidden'}
        >
          {children}
        </motion.div>
      )}
    </section>
  )
}

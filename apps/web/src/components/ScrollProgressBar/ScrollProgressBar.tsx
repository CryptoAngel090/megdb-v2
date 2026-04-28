'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import styles from './ScrollProgressBar.module.css'

/**
 * Scroll progress bar — no spring physics, no bounce.
 * Uses a direct linear mapping from scrollYProgress → scaleX
 * so the bar tracks the scroll position exactly without lag or overshoot.
 * CSS `transition: transform 80ms linear` on the fill element adds just enough
 * smoothing to avoid jitter on low-DPI scroll events.
 */
export function ScrollProgressBar() {
  const reduceMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll()
  // Direct 1:1 mapping — no spring, no damping
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  if (reduceMotion) return null

  return (
    <div className={styles.track} aria-hidden>
      <motion.div className={styles.fill} style={{ scaleX }} />
    </div>
  )
}

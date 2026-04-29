'use client'

import { useEffect, useState } from 'react'
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
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
      const value = Math.min(1, Math.max(0, window.scrollY / maxScroll))
      setProgress(value)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (reduceMotion) return null

  return (
    <div className={styles.track} aria-hidden>
      <div className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}

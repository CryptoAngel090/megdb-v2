'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { useDeviceTier } from '@/hooks/useDeviceTier'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import styles from './ScrollProgressBar.module.css'

export function ScrollProgressBar() {
  const reduceMotion = usePrefersReducedMotion()
  const { tier } = useDeviceTier()
  const { scrollYProgress } = useScroll()
  const lightSpring = reduceMotion || tier === 'low'
  const scaleX = useSpring(scrollYProgress, {
    stiffness: lightSpring ? 8000 : 100,
    damping: lightSpring ? 120 : 30,
    restDelta: 0.001,
  })

  return (
    <div className={styles.track} aria-hidden>
      <motion.div className={styles.fill} style={{ scaleX }} />
    </div>
  )
}

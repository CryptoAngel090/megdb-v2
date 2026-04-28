import type { UseInViewOptions } from 'framer-motion'
import type { Variants } from 'framer-motion'

/**
 * Single easing curve used everywhere for scroll-reveal animations.
 * Smooth deceleration — no spring bounce, no overshoot.
 */
export const EASE_SMOOTH: [number, number, number, number] = [0.25, 0.1, 0, 1]

/** Legacy aliases kept for imports that reference them directly. */
const EASE_OUT: [number, number, number, number] = EASE_SMOOTH

const shelfInViewOptions: UseInViewOptions = {
  once: true,
  amount: 'some',
  margin: '0px 0px -60px 0px',
}

/**
 * Section-level scroll reveal: fade up smoothly when the shelf enters the viewport.
 * duration 0.55s — fast enough to feel snappy, slow enough to feel intentional.
 */
const shelfSectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.55, ease: EASE_SMOOTH },
  },
}

const shelfMediaRowListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

const mediaShelfCardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.45, ease: EASE_SMOOTH },
  },
}

const actorRowListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

const actorCardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.45, ease: EASE_SMOOTH },
  },
}

const tapTransition = {
  type: 'tween' as const,
  duration: 0.15,
  ease: EASE_OUT,
}

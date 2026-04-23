import type { UseInViewOptions } from 'framer-motion'
import type { Variants } from 'framer-motion'

// ── Animation Constants 2026 ────────────────────────────────────────────────

const DURATION = {
  FAST: 0.15,
  MEDIUM: 0.25,
  SLOW: 0.35,
  CINEMA: 0.5,
}

const EASING = {
  OUT: [0.25, 0.46, 0.45, 0.94] as const,
  CINEMA: [0.16, 1, 0.3, 1] as const,
  SPRING: [0.34, 1.56, 0.64, 1] as const,
}

// ── Scroll / intersection (use on an element that never uses opacity: 0) ─────

export const shelfInViewOptions: UseInViewOptions = {
  once: true,
  amount: 'some',
  margin: '0px 0px -100px 0px', // Trigger earlier for smoother experience
}

/** Applied to inner `motion.div` — outer `<section>` holds `ref` for `useInView`. */
export const shelfSectionRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.98, // Subtle scale for depth
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.CINEMA,
      ease: EASING.CINEMA,
    },
  },
}

// ── Media shelf row + cards (stagger driven by parent `visible`) ────────────

export const shelfMediaRowListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06, // Faster stagger for 2026
      delayChildren: 0.15,
    },
  },
}

/** Card tiles under `shelfMediaRowListVariants` — no per-card `whileInView`. */
export const mediaShelfCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
    rotateY: -5, // Subtle 3D effect
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.5,
      ease: EASING.CINEMA,
    },
  },
}

// ── Popular actors rail ─────────────────────────────────────────────────────

export const actorRowListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // Faster for actors
      delayChildren: 0.12,
    },
  },
}

export const actorCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: EASING.CINEMA,
    },
  },
}

/** Shared spring for shelf scroll / actor tile taps */
export const shelfTapSpring = {
  type: 'spring' as const,
  stiffness: 520, // Snappier for 2026
  damping: 28,
}

export const shelfLinkTapSpring = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 24,
}

export const actorTileTapSpring = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 26,
}

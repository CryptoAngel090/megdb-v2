import type { Variants } from 'framer-motion'

type Bezier = [number, number, number, number]

const spring: Bezier = [0.22, 1, 0.36, 1]
const bounce: Bezier = [0.34, 1.56, 0.64, 1]

/** No large motion (y/scale), only short opacity crossfade — OK for prefers-reduced-motion */
const subtleFade = { duration: 0.38, ease: 'easeOut' as const }
const subtleFadeFast = { duration: 0.28, ease: 'easeOut' as const }

export function buildHeroContentVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: subtleFade },
      exit: { opacity: 0, transition: subtleFadeFast },
    }
  }
  return {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: spring } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.4 } },
  }
}

export function buildHeroTitleVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { ...subtleFade, delay: 0.04 } },
    }
  }
  return {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1, ease: spring } },
  }
}

export function buildHeroMetaVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { ...subtleFade, delay: 0.08 } },
    }
  }
  return {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.25, ease: 'easeOut' as const },
    },
  }
}

export function buildHeroButtonsVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { ...subtleFade, delay: 0.12 } },
    }
  }
  return {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.4, ease: 'easeOut' as const },
    },
  }
}

export function buildHeroOverviewVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { ...subtleFade, delay: 0.14 } },
    }
  }
  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, delay: 0.32, ease: spring },
    },
  }
}

export const btnPrimaryVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.04, transition: { duration: 0.2, ease: bounce } },
  tap: { scale: 0.97 },
}

export const btnSecondaryVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.04, transition: { duration: 0.2 } },
  tap: { scale: 0.97 },
}

export function buildSlideVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
      exit: { opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } },
    }
  }
  return {
    enter: { opacity: 0, scale: 1.05 },
    center: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: spring } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.5 } },
  }
}

import { Variants } from 'framer-motion'

type Bezier = [number, number, number, number]
const spring: Bezier = [0.22, 1, 0.36, 1]

export const pillVariants: Variants = {
  top: { boxShadow: '0 8px 32px oklch(0% 0 0 / 0.2)', transition: { duration: 0.4, ease: spring } },
  scrolled: {
    boxShadow: '0 8px 48px oklch(0% 0 0 / 0.5)',
    transition: { duration: 0.4, ease: spring },
  },
}

export const drawerVariants: Variants = {
  closed: { x: '-100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
  open: { x: '0%', transition: { duration: 0.32, ease: spring } },
}

export const backdropVariants: Variants = {
  closed: { opacity: 0, pointerEvents: 'none' as const, transition: { duration: 0.25 } },
  open: { opacity: 1, pointerEvents: 'auto' as const, transition: { duration: 0.3 } },
}

export const navItemVariants: Variants = {
  closed: { opacity: 0, x: -16 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: spring, delay: 0.05 + i * 0.055 },
  }),
}

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    pointerEvents: 'none' as const,
    transition: { duration: 0.15 },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: 'auto' as const,
    transition: { duration: 0.2, ease: spring },
  },
}

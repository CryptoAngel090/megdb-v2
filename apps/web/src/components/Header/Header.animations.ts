import { Variants } from 'framer-motion'

const ease: [number, number, number, number] = [0.25, 0.1, 0, 1]

export const drawerVariants: Variants = {
  closed: { x: '-100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
  open: { x: '0%', transition: { duration: 0.28, ease } },
}

export const backdropVariants: Variants = {
  closed: { opacity: 0, pointerEvents: 'none' as const, transition: { duration: 0.2 } },
  open: { opacity: 1, pointerEvents: 'auto' as const, transition: { duration: 0.25 } },
}

export const navItemVariants: Variants = {
  closed: { opacity: 0, x: -12 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    // Reduced stagger: 0.03s per item instead of 0.055s — no spring feel
    transition: { duration: 0.25, ease, delay: 0.03 + i * 0.03 },
  }),
}

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    pointerEvents: 'none' as const,
    transition: { duration: 0.15, ease },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: 'auto' as const,
    transition: { duration: 0.2, ease },
  },
}

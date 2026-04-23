type Bezier = [number, number, number, number]

const spring: Bezier = [0.22, 1, 0.36, 1]

export const searchBarVariants = {
  idle: { boxShadow: '0 0 0 0px transparent' },
  focused: { boxShadow: '0 0 0 0px transparent', transition: { duration: 0.2, ease: spring } },
}

export const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: spring },
  },
}

/** Instant open/close when user prefers reduced motion */
export const dropdownVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
}

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

export const searchBarVariants = {
  idle: { boxShadow: '0 0 0 0px transparent' },
  focused: { boxShadow: '0 0 0 0px transparent', transition: { duration: 0.2, ease } },
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
    transition: { duration: 0.2, ease },
  },
}

export const dropdownVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
}

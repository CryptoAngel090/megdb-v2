type Bezier = [number, number, number, number]

const bounce: Bezier = [0.25, 0.1, 0, 1] // replaced spring-like bounce with smooth bezier

export const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: bounce } },
}

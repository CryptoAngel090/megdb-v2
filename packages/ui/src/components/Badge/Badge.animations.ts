type Bezier = [number, number, number, number]

const bounce: Bezier = [0.34, 1.56, 0.64, 1]

export const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: bounce } },
}

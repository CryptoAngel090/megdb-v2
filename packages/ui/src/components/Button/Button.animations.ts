type Bezier = [number, number, number, number]

const bounce: Bezier = [0.34, 1.56, 0.64, 1]

export const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.15, ease: bounce } },
  tap: { scale: 0.97, transition: { duration: 0.1 } },
}

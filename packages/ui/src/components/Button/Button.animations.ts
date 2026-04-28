type Bezier = [number, number, number, number]

const smooth: Bezier = [0.25, 0.1, 0, 1]

export const buttonVariants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: { type: 'tween' as const, duration: 0.15, ease: smooth },
  },
  tap: {
    scale: 0.97,
    transition: { type: 'tween' as const, duration: 0.1, ease: smooth },
  },
}

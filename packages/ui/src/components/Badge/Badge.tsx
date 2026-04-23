import { motion } from 'framer-motion'
import { badgeVariants } from './Badge.animations'
import styles from './Badge.module.css'

interface BadgeProps {
  variant?: 'genre' | 'rating' | 'type' | 'new' | 'status'
  children: React.ReactNode
  animated?: boolean
  className?: string
}

export function Badge({ variant = 'genre', children, animated = false, className }: BadgeProps) {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ')

  if (animated) {
    return (
      <motion.span className={classes} variants={badgeVariants} initial="hidden" animate="visible">
        {children}
      </motion.span>
    )
  }

  return <span className={classes}>{children}</span>
}

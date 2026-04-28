'use client'

import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { buttonVariants } from './Button.animations'
import styles from './Button.module.css'

type OwnProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  iconOnly?: boolean
  /** Pill / circular affordance for floating actions (pair with `iconOnly` for round FAB). */
  fab?: boolean
  loading?: boolean
  /** Merged after design-system button classes */
  className?: string | undefined
  children: React.ReactNode
}

export type ButtonProps = OwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof OwnProps | 'ref'>

type ButtonSize = NonNullable<OwnProps['size']>

/** Semantic size map instead of direct `styles[size]` modifier access. */
const sizeClasses: Record<ButtonSize, string> = {
  sm: styles.sm ?? '',
  md: '',
  lg: styles.lg ?? '',
}

/** Spacing/radius are centralized in `.button` base styles; keep semantic slots explicit. */
const spacingClasses: Record<ButtonSize, string> = {
  sm: '',
  md: '',
  lg: '',
}

const borderRadiusClasses: Record<ButtonSize, string> = {
  sm: '',
  md: '',
  lg: '',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    iconOnly = false,
    fab = false,
    loading = false,
    type = 'button',
    className,
    children,
    disabled = false,
    ...rest
  },
  ref
) {
  const variants = buttonVariants

  const classes = [
    styles.button,
    styles[variant],
    sizeClasses[size],
    spacingClasses[size],
    borderRadiusClasses[size],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    fab && styles.fab,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.button
      ref={ref}
      {...(rest as unknown as HTMLMotionProps<'button'>)}
      type={type}
      className={classes}
      disabled={Boolean(disabled) || loading}
      variants={variants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  )
})

'use client'

import { motion } from 'framer-motion'
import { buttonVariants } from './Button.animations'
import styles from './Button.module.css'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className,
}: ButtonProps) {
  const variants = buttonVariants

  const classes = [
    styles.button,
    styles[variant],
    size !== 'md' && styles[size],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      variants={variants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  )
}

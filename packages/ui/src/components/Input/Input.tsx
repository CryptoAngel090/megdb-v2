'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { inputVariants } from './Input.animations'
import styles from './Input.module.css'

interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  type?: 'text' | 'email' | 'password' | 'search' | 'number'
  disabled?: boolean
  error?: string
  icon?: React.ReactNode
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  name?: string
  id?: string
  autoComplete?: string
}

export function Input({
  label,
  placeholder,
  value,
  defaultValue,
  type = 'text',
  disabled = false,
  error,
  icon,
  onChange,
  onFocus,
  onBlur,
  className,
  name,
  id,
  autoComplete,
}: InputProps) {
  const [focused, setFocused] = useState(false)

  const wrapperClasses = [styles.wrapper, error && styles.error, className]
    .filter(Boolean)
    .join(' ')

  const inputWrapperClasses = [styles.inputWrapper, icon && styles.hasIcon]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={inputWrapperClasses}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <motion.input
          id={id}
          name={name}
          type={type}
          className={styles.input}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          autoComplete={autoComplete}
          animate={focused ? 'focused' : 'idle'}
          variants={inputVariants}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => {
            setFocused(true)
            onFocus?.()
          }}
          onBlur={() => {
            setFocused(false)
            onBlur?.()
          }}
        />
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  )
}

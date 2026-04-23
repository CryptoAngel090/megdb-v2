'use client'

import { useId, type ReactNode } from 'react'
import styles from './FormField.module.css'

interface FormFieldProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** rule 72: inline error под полем, не alert */
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
  icon?: ReactNode
  className?: string
}

/**
 * rule 72: Inline error под полем, не alert
 * "Неверный email" под полем = конкретно и не блокирует интерфейс.
 */
export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  disabled,
  autoComplete,
  icon,
  className,
}: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const hasError = Boolean(error)
  const hasHint = Boolean(hint)

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <div className={`${styles.inputWrap} ${hasError ? styles.inputWrapError : ''}`}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          className={`${styles.input} ${icon ? styles.inputWithIcon : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={
            [hasError && errorId, hasHint && hintId].filter(Boolean).join(' ') || undefined
          }
        />
      </div>

      {/* rule 72: inline error — под полем, не alert */}
      {hasError && (
        <p id={errorId} className={styles.error} role="alert" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </p>
      )}

      {/* Подсказка — только если нет ошибки */}
      {hasHint && !hasError && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}

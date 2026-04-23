import styles from './Spinner.module.css'

interface SpinnerProps {
  /** rule 68: размер — sm для inline, md для блоков, lg для страниц */
  size?: 'sm' | 'md' | 'lg'
  /** Текст для screen readers */
  label?: string
  className?: string
}

/**
 * rule 68: Spinner = неизвестная форма загрузки
 * Используй когда не знаешь что будет (трейлер, авторизация, отправка формы).
 * Для карточек — используй Skeleton (rule 67).
 */
export function Spinner({ size = 'md', label = 'Loading…', className }: SpinnerProps) {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className ?? ''}`}
      role="status"
      aria-label={label}
    >
      <svg className={styles.svg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className={styles.track} cx="12" cy="12" r="10" strokeWidth="2.5" />
        <circle
          className={styles.arc}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="31.4"
          strokeDashoffset="23.5"
        />
      </svg>
      <span className={styles.srOnly}>{label}</span>
    </div>
  )
}

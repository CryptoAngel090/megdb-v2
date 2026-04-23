import type { ReactNode } from 'react'
import Link from 'next/link'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  /** rule 71: иконка (эмодзи или SVG) */
  icon?: ReactNode
  /** Заголовок — что произошло */
  title: string
  /** Описание — почему и что делать */
  description?: string
  /** rule 71: CTA — решение проблемы */
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
  className?: string
}

/**
 * rule 71: Empty state — иконка + текст + CTA
 * Пустой список без объяснения = тупик.
 * Иконка + "Ничего не найдено" + "Начать поиск" = решение.
 */
export function EmptyState({
  icon = '🎬',
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
}: EmptyStateProps) {
  const hasCta = ctaLabel && (ctaHref || onCtaClick)

  return (
    <div className={`${styles.root} ${className ?? ''}`} role="status">
      {/* rule 71: иконка */}
      <div className={styles.icon} aria-hidden="true">
        {icon}
      </div>

      {/* rule 71: текст */}
      <h3 className={styles.title}>{title}</h3>

      {description && <p className={styles.description}>{description}</p>}

      {/* rule 71: CTA */}
      {hasCta &&
        (ctaHref ? (
          <Link href={ctaHref} className={styles.cta}>
            {ctaLabel}
          </Link>
        ) : (
          <button type="button" className={styles.cta} onClick={onCtaClick}>
            {ctaLabel}
          </button>
        ))}
    </div>
  )
}

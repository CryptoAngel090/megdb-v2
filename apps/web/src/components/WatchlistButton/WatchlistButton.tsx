'use client'

import { useCallback, useOptimistic, useTransition } from 'react'
import styles from './WatchlistButton.module.css'

interface WatchlistButtonProps {
  movieId: number
  initialInWatchlist?: boolean
  /** Вызывается после подтверждения сервером */
  onToggle?: (movieId: number, added: boolean) => Promise<void>
  className?: string
}

/**
 * rule 70: Optimistic UI — клик "В список" → мгновенно "Добавлено"
 * Не ждём сервер. Если ошибка — откатываем.
 */
export function WatchlistButton({
  movieId,
  initialInWatchlist = false,
  onToggle,
  className,
}: WatchlistButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticInList, setOptimisticInList] = useOptimistic(initialInWatchlist)

  const handleClick = useCallback(() => {
    startTransition(async () => {
      // rule 70: мгновенно обновляем UI до ответа сервера
      setOptimisticInList(!optimisticInList)

      try {
        await onToggle?.(movieId, !optimisticInList)
      } catch {
        // Откат произойдёт автоматически через useOptimistic при ошибке
      }
    })
  }, [movieId, optimisticInList, onToggle, setOptimisticInList])

  const label = optimisticInList ? 'In Watchlist' : 'Add to Watchlist'

  return (
    <button
      type="button"
      className={`${styles.btn} ${optimisticInList ? styles.btnActive : ''} ${isPending ? styles.btnPending : ''} ${className ?? ''}`}
      onClick={handleClick}
      aria-pressed={optimisticInList}
      aria-label={label}
      title={label}
    >
      {/* Иконка закладки */}
      <svg
        className={styles.icon}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={optimisticInList ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {optimisticInList ? (
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        ) : (
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        )}
      </svg>
      <span className={styles.label}>{label}</span>
    </button>
  )
}

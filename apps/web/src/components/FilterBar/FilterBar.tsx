'use client'

import { useCallback } from 'react'
import styles from './FilterBar.module.css'

export interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  /** Заголовок группы фильтров (для aria-label) */
  label: string
  options: FilterOption[]
  /** Текущее активное значение. Пустая строка = нет активного фильтра */
  value: string
  onChange: (value: string) => void
  /** Значение по умолчанию (сброс). Обычно '' или 'all' */
  defaultValue?: string
  className?: string
}

/**
 * rule 62: Горизонтальная полоса фильтров под заголовком
 * rule 63: Активный фильтр = залитый фон (акцентный цвет)
 * rule 64: "Очистить" только при активных фильтрах
 * rule 65: Изменение = мгновенный результат (onChange вызывается сразу)
 */
export function FilterBar({
  label,
  options,
  value,
  onChange,
  defaultValue = '',
  className,
}: FilterBarProps) {
  const handleClick = useCallback(
    (optValue: string) => {
      // rule 65: мгновенно — без "Применить"
      onChange(optValue)
    },
    [onChange]
  )

  // rule 64: кнопка "Очистить" видна только когда есть активный фильтр
  const hasActiveFilter = value !== defaultValue && value !== ''

  const handleClear = useCallback(() => {
    onChange(defaultValue)
  }, [onChange, defaultValue])

  return (
    <div className={`${styles.filterBar} ${className ?? ''}`} role="group" aria-label={label}>
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ''}`}
            onClick={() => handleClick(opt.value)}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        )
      })}

      {/* rule 64: показываем "Очистить" только когда есть активный фильтр */}
      {hasActiveFilter && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={handleClear}
          aria-label={`Clear ${label} filter`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  )
}

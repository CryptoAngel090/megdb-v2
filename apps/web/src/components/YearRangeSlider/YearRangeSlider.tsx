'use client'

import { useCallback, useId } from 'react'
import styles from './YearRangeSlider.module.css'

interface YearRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  /** rule 65: onChange вызывается мгновенно при каждом движении */
  onChange: (range: [number, number]) => void
  className?: string
}

/**
 * rule 66: Диапазон годов = слайдер (не 2 инпута)
 * rule 65: Мгновенный результат — onChange при каждом движении
 */
export function YearRangeSlider({ min, max, value, onChange, className }: YearRangeSliderProps) {
  const id = useId()
  const [from, to] = value

  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFrom = Math.min(Number(e.target.value), to - 1)
      // rule 65: мгновенно
      onChange([newFrom, to])
    },
    [to, onChange]
  )

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTo = Math.max(Number(e.target.value), from + 1)
      // rule 65: мгновенно
      onChange([from, newTo])
    },
    [from, onChange]
  )

  // Позиции для заливки трека между ручками
  const fromPct = ((from - min) / (max - min)) * 100
  const toPct = ((to - min) / (max - min)) * 100

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.labels}>
        <span className={styles.label} id={`${id}-from-label`}>
          From
        </span>
        <span className={styles.values} aria-live="polite" aria-atomic="true">
          <strong>{from}</strong>
          <span className={styles.dash}>—</span>
          <strong>{to}</strong>
        </span>
        <span className={styles.label} id={`${id}-to-label`}>
          To
        </span>
      </div>

      <div className={styles.trackWrap} aria-hidden="true">
        {/* Серый трек */}
        <div className={styles.track} />
        {/* Красная заливка между ручками */}
        <div
          className={styles.fill}
          style={{
            left: `${fromPct}%`,
            width: `${toPct - fromPct}%`,
          }}
        />
      </div>

      {/* Два range input поверх трека */}
      <div className={styles.inputs}>
        <input
          type="range"
          className={styles.thumb}
          min={min}
          max={max}
          value={from}
          onChange={handleFromChange}
          aria-label={`Start year, currently ${from}`}
          aria-labelledby={`${id}-from-label`}
        />
        <input
          type="range"
          className={styles.thumb}
          min={min}
          max={max}
          value={to}
          onChange={handleToChange}
          aria-label={`End year, currently ${to}`}
          aria-labelledby={`${id}-to-label`}
        />
      </div>
    </div>
  )
}

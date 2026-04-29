'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import styles from './NavigationProgress.module.css'

/**
 * rule 69: Progress bar вверху при навигации
 * Показывает что страница грузится — пользователь видит прогресс, не только skeleton.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number>(0)
  const prevRouteRef = useRef(`${pathname}?${searchParams.toString()}`)

  useEffect(() => {
    const currentRoute = `${pathname}?${searchParams.toString()}`

    // Маршрут изменился — запускаем прогресс
    if (currentRoute !== prevRouteRef.current) {
      prevRouteRef.current = currentRoute

      // Сброс
      if (timerRef.current) clearTimeout(timerRef.current)
      cancelAnimationFrame(rafRef.current)

      setProgress(0)
      setVisible(true)

      // Быстро до 80%, потом замедляемся
      let p = 0
      const step = () => {
        p = p < 60 ? p + 4 : p < 80 ? p + 1 : p + 0.3
        if (p >= 95) {
          setProgress(95)
          return
        }
        setProgress(p)
        rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)

      // Завершаем через небольшую задержку после смены маршрута
      timerRef.current = setTimeout(() => {
        cancelAnimationFrame(rafRef.current)
        setProgress(100)
        // Скрываем после анимации завершения
        timerRef.current = setTimeout(() => {
          setVisible(false)
          setProgress(0)
        }, 400)
      }, 300)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className={styles.bar}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Page loading"
    >
      <div className={styles.fill} style={{ transform: `scaleX(${progress / 100})` }} />
      {/* Светящийся кончик */}
      <div className={styles.glow} style={{ left: `${progress}%` }} />
    </div>
  )
}

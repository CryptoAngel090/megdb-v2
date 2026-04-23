'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Ripple.module.css'

interface RippleItem {
  x: number
  y: number
  size: number
  id: string
}

let rippleIdSeq = 0

function nextRippleId(): string {
  rippleIdSeq += 1
  return `ripple-${rippleIdSeq}-${Date.now()}`
}

export function Ripple() {
  const layerId = useId()
  const [ripples, setRipples] = useState<RippleItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const durationMs = 650

    const handlePointerDown = (e: PointerEvent) => {
      /* touch/pen primary contact — не отсекаем по button как у мыши */
      if (e.pointerType === 'mouse' && e.button !== 0) return
      /* Text nodes have no .closest — без этого любой клик по тексту ломал весь эффект */
      const t = e.target
      if (t == null || !(t instanceof Node)) return
      const el = t instanceof Element ? t : t.parentElement
      if (!el) return
      /* Не рисуем поверх нативных контролов, где клик важен визуально */
      if (el.closest('input, textarea, select, [contenteditable="true"], [data-no-ripple]')) {
        return
      }

      const size = Math.max(window.innerWidth, window.innerHeight) * 1.1
      const id = nextRippleId()
      const item: RippleItem = {
        x: e.clientX,
        y: e.clientY,
        size,
        id,
      }

      setRipples((prev) => [...prev, item])

      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, durationMs)
    }

    window.addEventListener('pointerdown', handlePointerDown, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true })
    }
  }, [mounted])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.rippleLayer} id={layerId} aria-hidden>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </div>,
    document.body
  )
}

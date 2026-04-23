'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const FPS_SAMPLE_MS = 1000
const LOW_FPS = 30
const RECOVER_FPS = 50
const HTML_CLASS = 'low-performance' as const

/**
 * Estimates FPS via rAF and toggles `html.low-performance` when the tab struggles.
 * Skips work when the user has `prefers-reduced-motion` (system already dials motion down).
 * Safe for root layout: one subscriber per app.
 */
export function usePerformanceMonitor() {
  const reduced = usePrefersReducedMotion()
  const [fps, setFps] = useState(60)
  const [isLowPerformance, setIsLowPerformance] = useState(false)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lowRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (reduced) {
      lowRef.current = false
      setIsLowPerformance(false)
      document.documentElement.classList.remove(HTML_CLASS)
      return
    }

    const root = document.documentElement

    const setLow = (low: boolean) => {
      if (lowRef.current === low) return
      lowRef.current = low
      root.classList.toggle(HTML_CLASS, low)
      setIsLowPerformance(low)
    }

    const resetSample = (now: number) => {
      frameCountRef.current = 0
      lastTimeRef.current = now
    }

    resetSample(performance.now())

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        resetSample(performance.now())
      }
    }
    document.addEventListener('visibilitychange', onVis)

    let rafId = 0

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick)

      if (document.visibilityState === 'hidden') {
        return
      }

      frameCountRef.current += 1
      const elapsed = now - lastTimeRef.current
      if (elapsed < FPS_SAMPLE_MS) {
        return
      }

      const currentFps = Math.round((frameCountRef.current * 1000) / Math.max(elapsed, 1))
      setFps(currentFps)
      if (currentFps < LOW_FPS) {
        setLow(true)
      } else if (currentFps > RECOVER_FPS) {
        setLow(false)
      }

      resetSample(now)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafId)
      setLow(false)
      lowRef.current = false
      root.classList.remove(HTML_CLASS)
    }
  }, [reduced])

  return {
    fps: reduced ? 60 : fps,
    isLowPerformance: reduced ? false : isLowPerformance,
  }
}

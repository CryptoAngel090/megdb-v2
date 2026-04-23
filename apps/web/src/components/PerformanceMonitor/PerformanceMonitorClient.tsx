'use client'

import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'

/** client: FPS sampling + `html.low-performance` — must run in browser */
export function PerformanceMonitorClient() {
  usePerformanceMonitor()
  return null
}

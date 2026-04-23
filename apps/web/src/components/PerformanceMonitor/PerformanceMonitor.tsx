import { PerformanceMonitorClient } from './PerformanceMonitorClient'

/**
 * Mounts FPS sampling once at app root. Renders nothing.
 * Server entry re-exports a tiny client leaf (see PerformanceMonitorClient).
 */
export function PerformanceMonitor() {
  return <PerformanceMonitorClient />
}

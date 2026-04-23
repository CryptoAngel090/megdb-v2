'use client'

import { useSyncExternalStore } from 'react'

/**
 * Browser `prefers-reduced-motion`. Server snapshot is `false` so SSR + first paint
 * match; after hydration the real preference applies. Avoids Framer's hook sometimes
 * aligning with a conservative default during SSR.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Same implementation — safe SSR snapshot. Use if migrating from Framer’s `useReducedMotion`. */
export const useReducedMotion = usePrefersReducedMotion

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

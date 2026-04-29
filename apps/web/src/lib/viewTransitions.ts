function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Progressive enhancement for route/state transitions.
 * Falls back to immediate update when unsupported.
 */
export function runViewTransition(update: () => void): void {
  if (typeof document === 'undefined' || shouldReduceMotion()) {
    update()
    return
  }

  const doc = document as Document
  if (typeof doc.startViewTransition !== 'function') {
    update()
    return
  }

  doc.startViewTransition(() => {
    update()
  })
}

// client: registers service worker in browser runtime
'use client'

import { useEffect } from 'react'

const SW_PATH = '/sw.js'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    const clearMegdbCaches = async () => {
      if (!('caches' in window)) return
      const cacheKeys = await caches.keys()
      await Promise.all(
        cacheKeys.filter((key) => key.startsWith('megdb-')).map((key) => caches.delete(key))
      )
    }

    const register = async () => {
      try {
        if (isLocalhost) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((reg) => reg.unregister()))
          await clearMegdbCaches()
          return
        }
        await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
      } catch (error) {
        console.error('[sw] registration failed', error)
      }
    }

    void register()
  }, [])

  return null
}

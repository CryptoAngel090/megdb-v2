// client: registers service worker in browser runtime
'use client'

import { useEffect } from 'react'

const SW_PATH = '/sw.js'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
      } catch (error) {
        console.error('[sw] registration failed', error)
      }
    }

    void register()
  }, [])

  return null
}

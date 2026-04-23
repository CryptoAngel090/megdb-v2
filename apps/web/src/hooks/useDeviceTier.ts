'use client'

import { useCallback, useEffect, useState } from 'react'
import { detectDeviceTier, shouldEnableEffect, type DeviceTier } from '@/lib/deviceTier'

/**
 * Клиентский tier (после mount). На сервере и до гидрации — `medium`, как в `detectDeviceTier()`.
 */
export function useDeviceTier() {
  const [tier, setTier] = useState<DeviceTier>('medium')

  useEffect(() => {
    setTier(detectDeviceTier())
  }, [])

  const canUse = useCallback((effect: string) => shouldEnableEffect(effect, tier), [tier])

  return { tier, shouldEnableEffect: canUse }
}

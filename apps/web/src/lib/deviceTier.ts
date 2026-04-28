/**
 * Coarse device capability for toggling heavy UI effects (animation, 3D, parallax).
 * `deviceMemory` is only in Chromium; defaults mirror prior heuristics.
 */

type DeviceTier = 'high' | 'medium' | 'low'

type NavigatorWithDeviceMemory = Navigator & {
  /** GiB, Chromium-only */
  deviceMemory?: number
}

const EFFECTS: Record<DeviceTier, readonly string[]> = {
  // Removed 'spring' effect globally — spring physics disabled.
  high: ['tilt', 'magnetic', 'parallax', 'cursor-trail'],
  // tilt removed from medium: 3D card rotation causes INP spikes on mid-range
  // phones during shelf scroll. Magnetic + parallax are kept as they are cheaper.
  medium: ['magnetic', 'parallax'],
  low: [],
}

function getDeviceMemoryGib(): number {
  if (typeof navigator === 'undefined') return 4
  const d = (navigator as NavigatorWithDeviceMemory).deviceMemory
  return typeof d === 'number' && d > 0 ? d : 4
}

/**
 * Pure heuristic: same rules as `detectDeviceTier` after reading cores, memory, UA.
 * Exposed for unit tests; app code should use `detectDeviceTier`.
 */
export function deviceTierFromSignals(
  cores: number,
  memoryGib: number,
  isMobile: boolean
): DeviceTier {
  if (cores >= 8 && memoryGib >= 8 && !isMobile) {
    return 'high'
  }

  if (cores < 4 || memoryGib < 4) {
    return 'low'
  }

  return 'medium'
}

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'medium'

  const cores =
    typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0
      ? navigator.hardwareConcurrency
      : 2
  const memory = getDeviceMemoryGib()
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)

  return deviceTierFromSignals(cores, memory, isMobile)
}

export function shouldEnableEffect(effect: string, tier: DeviceTier): boolean {
  return EFFECTS[tier].includes(effect)
}

/** Список имён эффектов по tier (для тестов / отладки) */
export function effectsForTier(tier: DeviceTier): readonly string[] {
  return EFFECTS[tier]
}

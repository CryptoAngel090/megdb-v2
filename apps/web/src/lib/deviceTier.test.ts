import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  detectDeviceTier,
  deviceTierFromSignals,
  effectsForTier,
  shouldEnableEffect,
} from './deviceTier'

describe('deviceTierFromSignals', () => {
  it('returns high only for strong desktop (8+ cores, 8+ GiB, not mobile)', () => {
    expect(deviceTierFromSignals(8, 8, false)).toBe('high')
    expect(deviceTierFromSignals(12, 16, false)).toBe('high')
  })

  it('does not return high for mobile even with many cores and memory', () => {
    expect(deviceTierFromSignals(8, 8, true)).toBe('medium')
    expect(deviceTierFromSignals(12, 16, true)).toBe('medium')
  })

  it('downgrades to medium when memory below 8 even with many cores (desktop)', () => {
    expect(deviceTierFromSignals(8, 4, false)).toBe('medium')
    expect(deviceTierFromSignals(8, 7, false)).toBe('medium')
  })

  it('returns low when cores < 4 or memory < 4', () => {
    expect(deviceTierFromSignals(2, 4, false)).toBe('low')
    expect(deviceTierFromSignals(4, 2, false)).toBe('low')
    expect(deviceTierFromSignals(1, 1, false)).toBe('low')
  })
})

describe('shouldEnableEffect and effectsForTier', () => {
  it('maps low tier to no heavy effects (spring removed)', () => {
    const low = effectsForTier('low')
    expect(low).not.toContain('spring')
    expect(low).not.toContain('magnetic')
    expect(shouldEnableEffect('spring', 'low')).toBe(false)
    expect(shouldEnableEffect('tilt', 'low')).toBe(false)
    expect(shouldEnableEffect('magnetic', 'low')).toBe(false)
  })

  it('high tier includes magnetic and tilt', () => {
    expect(shouldEnableEffect('magnetic', 'high')).toBe(true)
    expect(shouldEnableEffect('tilt', 'high')).toBe(true)
    expect(shouldEnableEffect('parallax', 'high')).toBe(true)
  })

  it('medium tier has magnetic but not tilt (tilt removed to reduce INP on mid-range phones)', () => {
    expect(shouldEnableEffect('tilt', 'medium')).toBe(false)
    expect(shouldEnableEffect('magnetic', 'medium')).toBe(true)
    expect(shouldEnableEffect('spring', 'medium')).toBe(false)
    expect(shouldEnableEffect('parallax', 'medium')).toBe(true)
  })
})

describe('detectDeviceTier', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns medium when window is undefined (SSR / non-browser)', () => {
    vi.stubGlobal('window', undefined)
    const nav = {
      hardwareConcurrency: 12,
      deviceMemory: 16,
      userAgent: 'Chrome',
    } as unknown as Navigator
    vi.stubGlobal('navigator', nav)
    expect(detectDeviceTier()).toBe('medium')
  })

  it('uses navigator when window is present: high for strong desktop', () => {
    vi.stubGlobal('window', { document: {} })
    const nav = {
      hardwareConcurrency: 8,
      deviceMemory: 8,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
    } as unknown as Navigator
    vi.stubGlobal('navigator', nav)
    expect(detectDeviceTier()).toBe('high')
  })

  it('treats iPhone UA as mobile: not high even with 8/8', () => {
    vi.stubGlobal('window', { document: {} })
    const nav = {
      hardwareConcurrency: 8,
      deviceMemory: 8,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    } as unknown as Navigator
    vi.stubGlobal('navigator', nav)
    expect(detectDeviceTier()).toBe('medium')
  })

  it('defaults to 2 cores and 4 GiB memory when values missing', () => {
    vi.stubGlobal('window', { document: {} })
    const nav = {
      hardwareConcurrency: 0,
      userAgent: 'Windows',
    } as unknown as Navigator
    vi.stubGlobal('navigator', nav)
    // cores 2, memory 4 (default) → low
    expect(detectDeviceTier()).toBe('low')
  })
})

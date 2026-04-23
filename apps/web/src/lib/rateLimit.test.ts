import { describe, expect, it } from 'vitest'
import { checkRateLimit } from './rateLimit'

describe('checkRateLimit', () => {
  it('allows requests up to the limit', () => {
    const key = `test:${Math.random()}`
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5).ok).toBe(true)
    }
    expect(checkRateLimit(key, 5).ok).toBe(false)
  })
})

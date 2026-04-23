import { describe, expect, it } from 'vitest'
import { getNextSelectionIndex, hasLikelySessionCookie } from './drawerSearch.utils'

describe('getNextSelectionIndex', () => {
  it('returns -1 when list is empty', () => {
    expect(getNextSelectionIndex(0, 0, 'down')).toBe(-1)
  })

  it('cycles down through results', () => {
    expect(getNextSelectionIndex(-1, 3, 'down')).toBe(0)
    expect(getNextSelectionIndex(1, 3, 'down')).toBe(2)
    expect(getNextSelectionIndex(2, 3, 'down')).toBe(0)
  })

  it('cycles up through results', () => {
    expect(getNextSelectionIndex(0, 3, 'up')).toBe(2)
    expect(getNextSelectionIndex(2, 3, 'up')).toBe(1)
  })
})

describe('hasLikelySessionCookie', () => {
  it('detects session-like cookies', () => {
    expect(hasLikelySessionCookie('foo=1; session=abc')).toBe(true)
    expect(hasLikelySessionCookie('auth=jwt-token')).toBe(true)
    expect(hasLikelySessionCookie('my_token=value')).toBe(true)
  })

  it('returns false for unrelated cookies', () => {
    expect(hasLikelySessionCookie('theme=dark; locale=en')).toBe(false)
  })
})

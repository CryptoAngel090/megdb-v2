export function getNextSelectionIndex(
  current: number,
  total: number,
  direction: 'up' | 'down'
): number {
  if (total <= 0) return -1

  if (direction === 'down') {
    if (current >= total - 1) return 0
    return current + 1
  }

  if (current <= 0) return total - 1
  return current - 1
}

export function hasLikelySessionCookie(cookieString: string): boolean {
  const normalized = cookieString.toLowerCase()
  return (
    normalized.includes('session=') || normalized.includes('auth=') || normalized.includes('token=')
  )
}

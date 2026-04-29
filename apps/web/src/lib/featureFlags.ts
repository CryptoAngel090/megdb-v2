function parseBooleanFlag(rawValue: string | undefined): boolean {
  if (!rawValue) return false
  const normalized = rawValue.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

/**
 * Phase-1 scaffold for route-level detail shell optimization.
 * Default is OFF to keep current behavior stable.
 */
export function isDetailShellOptimizationEnabled(): boolean {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_DETAIL_SHELL_OPTIMIZATION)
}

export function isDetailRoutePathname(pathname: string): boolean {
  return (
    /^\/movie\/\d+/.test(pathname) ||
    /^\/tvshow\/\d+/.test(pathname) ||
    /^\/tvshows\/\d+/.test(pathname) ||
    /^\/series\/\d+/.test(pathname) ||
    /^\/cartoon\/\d+/.test(pathname)
  )
}

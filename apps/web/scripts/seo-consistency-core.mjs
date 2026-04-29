import { join } from 'node:path'

export function policyTokenToRoute(token) {
  if (token === 'SITE_URL') return '/'
  const match = token.match(/^\$\{SITE_URL\}(\/.*)$/)
  if (!match?.[1]) return null
  const path = match[1]
  return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
}

export function routeToPageFile(appDir, route) {
  if (!route.startsWith('/')) return null
  const parts = route.split('/').filter(Boolean)
  return join(appDir, ...parts, 'page.tsx')
}

export function routeToRobotsDisallow(route) {
  if (route.includes('[')) {
    const prefix = route.split('[')[0]
    return prefix.endsWith('/') ? prefix : `${prefix}/`
  }
  return route
}

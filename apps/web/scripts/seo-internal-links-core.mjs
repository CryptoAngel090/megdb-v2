import { relative } from 'node:path'

export function normalizeRoutePath(path) {
  if (!path) return null
  const raw = String(path).trim()
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  if (raw.startsWith('/api/')) return null
  const [noQuery] = raw.split('?')
  const [noHash] = noQuery.split('#')
  if (!noHash) return '/'
  if (noHash !== '/' && noHash.endsWith('/')) return noHash.slice(0, -1)
  return noHash
}

export function siteUrlTokenToPath(token) {
  if (token === 'SITE_URL') return '/'
  const match = token.match(/^\$\{SITE_URL\}(\/.*)$/)
  if (!match?.[1]) return null
  return normalizeRoutePath(match[1])
}

export function extractInternalLinkCandidates(source) {
  const values = []
  const patterns = [
    /(?:Link|ActiveNavLink|MagneticLink)\s+[^>]*href=\{?\s*["'`]([^"'`]+)["'`]\s*\}?/g,
    /\bhref\s*:\s*["'`]([^"'`]+)["'`]/g,
    /\brouter\.push\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(source)) != null) {
      if (m[1]) values.push(m[1])
    }
  }
  return values
}

export function buildInboundGraph(files) {
  const inbound = new Map()
  for (const file of files) {
    const seenInFile = new Set()
    for (const raw of extractInternalLinkCandidates(file.source)) {
      const route = normalizeRoutePath(raw)
      if (!route || seenInFile.has(route)) continue
      seenInFile.add(route)
      if (!inbound.has(route)) inbound.set(route, new Set())
      inbound.get(route).add(file.path)
    }
  }
  return inbound
}

export function toStaticRoutePath(appDir, pageFile) {
  const rel = relative(appDir, pageFile).replaceAll('\\', '/')
  if (!rel.endsWith('/page.tsx')) return null
  const route = `/${rel.replace(/\/page\.tsx$/, '')}`
  if (route.includes('[')) return null
  return normalizeRoutePath(route)
}

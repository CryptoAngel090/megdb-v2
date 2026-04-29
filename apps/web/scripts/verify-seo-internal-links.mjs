import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildInboundGraph,
  normalizeRoutePath,
  siteUrlTokenToPath,
  toStaticRoutePath,
} from './seo-internal-links-core.mjs'

const ROOT = process.cwd()
const APP_DIR = join(ROOT, 'src', 'app')
const COMPONENTS_DIR = join(ROOT, 'src', 'components')
const POLICY = JSON.parse(readFileSync(join(ROOT, 'scripts', 'seo-route-policy.json'), 'utf8'))

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, predicate, out)
      continue
    }
    if (predicate(full)) out.push(full)
  }
  return out
}

function isSourceFile(path) {
  return path.endsWith('.ts') || path.endsWith('.tsx')
}

const sourceFiles = [...walk(APP_DIR, isSourceFile), ...walk(COMPONENTS_DIR, isSourceFile)].map(
  (path) => ({ path, source: readFileSync(path, 'utf8') })
)

const inbound = buildInboundGraph(sourceFiles)
const forbidden = new Set(
  POLICY.forbiddenSitemapStaticRoutes
    .map(siteUrlTokenToPath)
    .filter(Boolean)
    .map(normalizeRoutePath)
)
const required = new Set(
  POLICY.requiredSitemapStaticRoutes.map(siteUrlTokenToPath).filter(Boolean).map(normalizeRoutePath)
)
const requiredEntityRoutes = new Set(
  (POLICY.requiredSitemapEntityRoutes ?? [])
    .map(siteUrlTokenToPath)
    .filter(Boolean)
    .map(normalizeRoutePath)
)

// Only enforce real static pages that actually exist in /src/app.
const staticPages = walk(APP_DIR, (p) => p.endsWith('/page.tsx') || p.endsWith('\\page.tsx'))
const existingStaticRoutes = new Set(
  staticPages.map((file) => toStaticRoutePath(APP_DIR, file)).filter(Boolean)
)

const checks = Array.from(required).filter(
  (route) => existingStaticRoutes.has(route) && !forbidden.has(route)
)
const orphanRoutes = []
for (const route of checks) {
  const refs = inbound.get(route)
  if (!refs || refs.size === 0) orphanRoutes.push(route)
}

const entityOrphans = []
for (const route of requiredEntityRoutes) {
  const slug = route.split('/').filter(Boolean).at(-1)
  if (!slug) continue
  const seedText = slug.replaceAll('-', ' ')
  const hasInboundEvidence = sourceFiles.some(
    (file) =>
      file.source.includes(route) ||
      (file.source.includes('buildEntityHref(') && file.source.toLowerCase().includes(seedText))
  )
  if (!hasInboundEvidence) entityOrphans.push(route)
}

if (orphanRoutes.length > 0 || entityOrphans.length > 0) {
  console.error(
    `SEO internal links check failed: ${orphanRoutes.length + entityOrphans.length} orphan route(s) detected:`
  )
  for (const route of orphanRoutes) console.error(`- ${route}`)
  for (const route of entityOrphans) console.error(`- ${route}`)
  process.exit(1)
}

console.log(
  `SEO internal links OK: ${checks.length} static routes and ${requiredEntityRoutes.size} entity hubs have inbound evidence.`
)

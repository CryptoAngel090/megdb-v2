import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseRouteQueryKeys, toRouteDepths } from './seo-crawl-budget-core.mjs'
import {
  extractInternalLinkCandidates,
  normalizeRoutePath,
  siteUrlTokenToPath,
} from './seo-internal-links-core.mjs'

const ROOT = process.cwd()
const APP_DIR = join(ROOT, 'src', 'app')
const COMPONENTS_DIR = join(ROOT, 'src', 'components')
const POLICY = JSON.parse(readFileSync(join(ROOT, 'scripts', 'seo-route-policy.json'), 'utf8'))
const MAX_STATIC_DEPTH = Number.parseInt(process.env.SEO_MAX_STATIC_ROUTE_DEPTH || '3', 10)

const FACET_BASES = new Set(['/movies', '/series', '/cartoons', '/tvshows'])
const FACET_ALLOWED_KEYS = new Set([
  'genre',
  'year',
  'coming',
  'expected',
  'provider',
  'studio',
  'rating',
  'language',
  'country',
  'runtime',
  'sort',
])

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

function routeForPageFile(file) {
  const rel = relative(APP_DIR, file).replaceAll('\\', '/')
  if (!rel.endsWith('/page.tsx')) return null
  const route = `/${rel.replace(/\/page\.tsx$/, '')}`
  if (route.includes('[')) return null
  return normalizeRoutePath(route)
}

const appSourceFiles = walk(APP_DIR, isSourceFile)
const componentSourceFiles = walk(COMPONENTS_DIR, isSourceFile)

const adjacency = new Map()
const globalTargets = new Set()
const queryIssues = []

for (const file of appSourceFiles) {
  const sourceRoute = routeForPageFile(file)
  if (!sourceRoute) continue
  const source = readFileSync(file, 'utf8')
  const rawLinks = extractInternalLinkCandidates(source)
  for (const raw of rawLinks) {
    const parsed = parseRouteQueryKeys(raw)
    if (!parsed) continue
    if (!adjacency.has(sourceRoute)) adjacency.set(sourceRoute, new Set())
    adjacency.get(sourceRoute).add(parsed.path)

    if (FACET_BASES.has(parsed.path)) {
      if (parsed.keys.length > 1) {
        queryIssues.push(`${file} -> ${raw} (multiple query keys on faceted base)`)
      }
      for (const key of parsed.keys) {
        if (!FACET_ALLOWED_KEYS.has(key)) {
          queryIssues.push(`${file} -> ${raw} (unsupported faceted key: ${key})`)
        }
      }
    }
  }
}

for (const file of componentSourceFiles) {
  const source = readFileSync(file, 'utf8')
  const rawLinks = extractInternalLinkCandidates(source)
  for (const raw of rawLinks) {
    const parsed = parseRouteQueryKeys(raw)
    if (!parsed) continue
    globalTargets.add(parsed.path)
    if (FACET_BASES.has(parsed.path)) {
      if (parsed.keys.length > 1) {
        queryIssues.push(`${file} -> ${raw} (multiple query keys on faceted base)`)
      }
      for (const key of parsed.keys) {
        if (!FACET_ALLOWED_KEYS.has(key)) {
          queryIssues.push(`${file} -> ${raw} (unsupported faceted key: ${key})`)
        }
      }
    }
  }
}

const requiredRoutes = new Set(
  POLICY.requiredSitemapStaticRoutes.map(siteUrlTokenToPath).filter(Boolean).map(normalizeRoutePath)
)
const forbiddenRoutes = new Set(
  POLICY.forbiddenSitemapStaticRoutes
    .map(siteUrlTokenToPath)
    .filter(Boolean)
    .map(normalizeRoutePath)
)

const staticPages = new Set(appSourceFiles.map(routeForPageFile).filter(Boolean))
const targets = Array.from(requiredRoutes).filter(
  (route) => staticPages.has(route) && !forbiddenRoutes.has(route)
)

const depths = toRouteDepths('/', adjacency, Array.from(globalTargets))
const unreachable = []
const tooDeep = []
for (const route of targets) {
  const depth = depths.get(route)
  if (depth == null) {
    unreachable.push(route)
    continue
  }
  if (depth > MAX_STATIC_DEPTH) {
    tooDeep.push({ route, depth })
  }
}

if (queryIssues.length > 0 || unreachable.length > 0 || tooDeep.length > 0) {
  if (queryIssues.length > 0) {
    console.error(`SEO crawl budget failed: ${queryIssues.length} faceted query issue(s):`)
    for (const issue of queryIssues) console.error(`- ${issue}`)
  }
  if (unreachable.length > 0) {
    console.error(
      `SEO crawl budget failed: ${unreachable.length} required route(s) unreachable from /:`
    )
    for (const route of unreachable) console.error(`- ${route}`)
  }
  if (tooDeep.length > 0) {
    console.error(
      `SEO crawl budget failed: ${tooDeep.length} route(s) exceed depth budget (${MAX_STATIC_DEPTH}):`
    )
    for (const row of tooDeep) console.error(`- ${row.route} (depth=${row.depth})`)
  }
  process.exit(1)
}

console.log(
  `SEO crawl budget OK: ${targets.length} required routes reachable within depth <= ${MAX_STATIC_DEPTH}.`
)

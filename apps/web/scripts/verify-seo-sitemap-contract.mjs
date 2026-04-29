import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  extractStaticRouteTokensFromArray,
  getVariableInitializer,
  parseTsFile,
} from './ts-ast-utils.mjs'

const sitemapFile = join(process.cwd(), 'src', 'app', 'sitemap.ts')
const src = readFileSync(sitemapFile, 'utf8')
const ast = parseTsFile(sitemapFile, src)
const policy = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts', 'seo-route-policy.json'), 'utf8')
)

// Public, indexable hub/static routes that must remain in sitemap.
const REQUIRED_INCLUDED = policy.requiredSitemapStaticRoutes
const REQUIRED_ENTITY_INCLUDED = policy.requiredSitemapEntityRoutes ?? []

// noindex/internal routes that must not be part of static sitemap entries.
const REQUIRED_EXCLUDED = policy.forbiddenSitemapStaticRoutes

const staticRoutesInit = getVariableInitializer(ast, 'STATIC_ROUTES')
const staticTokens = new Set(extractStaticRouteTokensFromArray(staticRoutesInit))

const missing = [...REQUIRED_INCLUDED, ...REQUIRED_ENTITY_INCLUDED].filter(
  (needle) => !staticTokens.has(needle)
)
const leaked = REQUIRED_EXCLUDED.filter((needle) => staticTokens.has(needle))

if (missing.length > 0 || leaked.length > 0) {
  if (missing.length > 0) {
    console.error(`SEO sitemap contract failed: missing ${missing.length} required route(s):`)
    for (const m of missing) console.error(`- ${m}`)
  }
  if (leaked.length > 0) {
    console.error(`SEO sitemap contract failed: found ${leaked.length} forbidden route(s):`)
    for (const l of leaked) console.error(`- ${l}`)
  }
  process.exit(1)
}

console.log(
  `SEO sitemap contract OK: ${REQUIRED_INCLUDED.length + REQUIRED_ENTITY_INCLUDED.length} required routes and ${REQUIRED_EXCLUDED.length} exclusions checked.`
)

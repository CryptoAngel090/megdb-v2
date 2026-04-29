import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { scaffoldChecksForSource } from './seo-scaffold-core.mjs'

const APP_DIR = join(process.cwd(), 'src', 'app')

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...walk(full))
      continue
    }
    if (entry === 'page.tsx') out.push(full)
  }
  return out
}

function toRoutePath(file) {
  const rel = relative(APP_DIR, file).replaceAll('\\', '/')
  const route = `/${rel.replace(/\/page\.tsx$/, '')}`
  return route === '/' ? '/' : route.replace(/\/+/g, '/')
}

function isStaticRoute(routePath) {
  return !routePath.includes('[')
}

const pages = walk(APP_DIR)
const missing = []

for (const file of pages) {
  const routePath = toRoutePath(file)
  if (!isStaticRoute(routePath)) continue

  const source = readFileSync(file, 'utf8')
  const checks = scaffoldChecksForSource(file, source)

  const failedChecks = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)

  if (failedChecks.length > 0) {
    missing.push({ file, routePath, failedChecks })
  }
}

if (missing.length > 0) {
  console.error(`SEO scaffold check failed in ${missing.length} static page(s):`)
  for (const item of missing) {
    console.error(`- ${item.routePath} (${item.file}) -> missing: ${item.failedChecks.join(', ')}`)
  }
  process.exit(1)
}

console.log(`SEO scaffold OK: ${pages.length} page.tsx files scanned.`)

/**
 * Runtime SEO smoke checks for rendered HTML.
 *
 * Usage:
 * - pnpm run verify:seo:smoke
 *
 * Env:
 * - SEO_SMOKE_BASE_URL (default: NEXT_PUBLIC_SITE_URL or https://megdb.com)
 * - SEO_SMOKE_TIMEOUT_MS (default: 15000)
 * - SEO_SMOKE_REQUIRE_JSONLD=true|false (default: true)
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fetchSitemapUrlsetUrls } from './sitemap-urlset-utils.mjs'

const baseUrl = (
  process.env.SEO_SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://megdb.com'
).replace(/\/$/, '')
const timeoutMs = Number.parseInt(process.env.SEO_SMOKE_TIMEOUT_MS || '15000', 10)
const requireJsonLd = (process.env.SEO_SMOKE_REQUIRE_JSONLD || 'true') !== 'false'
const maxConcurrency = Number.parseInt(process.env.SEO_SMOKE_CONCURRENCY || '8', 10)

const SITEMAP_LIMIT = Number.parseInt(process.env.SEO_SMOKE_SITEMAP_LIMIT || '150', 10)
const staticSampleLimit = Number.parseInt(process.env.SEO_SMOKE_STATIC_SAMPLE_LIMIT || '50', 10)
const detailSampleLimit = Number.parseInt(process.env.SEO_SMOKE_DETAIL_SAMPLE_LIMIT || '80', 10)
const facetSampleLimit = Number.parseInt(process.env.SEO_SMOKE_FACET_SAMPLE_LIMIT || '20', 10)
const staticPriorityRoutes = ['/', '/movies', '/series', '/cartoons', '/tvshows', '/about']
const policy = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts', 'seo-route-policy.json'), 'utf8')
)
const NOINDEX_ROUTES = policy.noindexRoutes.filter((route) => !route.includes('['))

function hasTag(html, re) {
  return re.test(html)
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message)
}

function parseTagAttributes(tag) {
  const attrs = new Map()
  const attrRe = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g
  let m
  while ((m = attrRe.exec(tag)) != null) {
    const key = (m[1] || '').toLowerCase()
    const value = m[3] ?? m[4] ?? m[5] ?? ''
    attrs.set(key, value.trim())
  }
  return attrs
}

function pickTagByPredicate(html, tagName, predicate) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi')
  let m
  while ((m = re.exec(html)) != null) {
    const tag = m[0]
    const attrs = parseTagAttributes(tag)
    if (predicate(attrs)) return attrs
  }
  return null
}

function pickTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i)
  return m?.[1]?.trim() ?? ''
}

function pickCanonical(html) {
  const attrs = pickTagByPredicate(
    html,
    'link',
    (a) => (a.get('rel') || '').toLowerCase() === 'canonical'
  )
  return attrs?.get('href')?.trim() ?? ''
}

function pickMetaContentByName(html, name) {
  const wanted = name.toLowerCase()
  const attrs = pickTagByPredicate(
    html,
    'meta',
    (a) => (a.get('name') || '').toLowerCase() === wanted
  )
  return attrs?.get('content')?.trim() ?? ''
}

function pickMetaContentByProperty(html, property) {
  const wanted = property.toLowerCase()
  const attrs = pickTagByPredicate(
    html,
    'meta',
    (a) => (a.get('property') || '').toLowerCase() === wanted
  )
  return attrs?.get('content')?.trim() ?? ''
}

function pickHtmlLang(html) {
  const attrs = pickTagByPredicate(html, 'html', () => true)
  return attrs?.get('lang')?.trim() ?? ''
}

async function fetchHtml(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const url = `${baseUrl}${path}`
    const res = await fetch(url, {
      headers: { 'user-agent': 'megdb-seo-smoke/1.0' },
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`${path}: HTTP ${res.status}`)
    }
    const html = await res.text()
    return { url, html }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${path}: request timeout after ${timeoutMs}ms (${baseUrl}${path})`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function fetchSitemapRoutes() {
  const allUrls = await fetchSitemapUrlsetUrls({
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    timeoutMs,
    maxUrls: SITEMAP_LIMIT,
    userAgent: 'megdb-seo-smoke/1.0',
  })
  const byClass = {
    static: [],
    detail: [],
    facet: [],
  }
  for (const raw of allUrls) {
    try {
      const u = new URL(raw)
      if (u.origin !== baseUrl) continue
      const route = u.pathname + (u.search || '')
      const type = classifyRoute(route)
      byClass[type].push(route)
    } catch {
      // ignore malformed rows
    }
  }

  const orderedStatic = [
    ...staticPriorityRoutes,
    ...byClass.static.filter((p) => !staticPriorityRoutes.includes(p)),
  ]

  const routes = [
    ...orderedStatic.slice(0, Math.max(1, staticSampleLimit)),
    ...byClass.detail.slice(0, Math.max(1, detailSampleLimit)),
    ...byClass.facet.slice(0, Math.max(1, facetSampleLimit)),
  ]

  return Array.from(new Set(routes))
}

function classifyRoute(path) {
  if (/^\/(movie|series|cartoon|tvshow|tvshows)\/[^/]+$/.test(path)) return 'detail'
  if (path.includes('?')) return 'facet'
  return 'static'
}

function checkCommonHead(path, html) {
  const title = pickTitle(html)
  assertOk(title.length >= 10 && title.length <= 70, `${path}: title length out of range`)
  const description = pickMetaContentByName(html, 'description')
  assertOk(
    description.length >= 50 && description.length <= 180,
    `${path}: meta description length out of range`
  )

  const canonical = pickCanonical(html)
  assertOk(canonical.length > 0, `${path}: missing canonical`)
  assertOk(
    canonical.startsWith(baseUrl) || canonical.startsWith('/'),
    `${path}: canonical must be absolute on base URL or root-relative`
  )
  assertOk(
    !hasTag(
      html,
      /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["'][^>]*>[\s\S]*<link[^>]+rel=["']canonical["']/i
    ),
    `${path}: duplicate canonical tags detected`
  )

  const ogUrl = pickMetaContentByProperty(html, 'og:url')
  assertOk(ogUrl.length > 0, `${path}: missing og:url`)
  const canonicalAbs = canonical.startsWith('/') ? `${baseUrl}${canonical}` : canonical
  assertOk(ogUrl === canonicalAbs, `${path}: og:url mismatch with canonical`)

  const htmlLang = pickHtmlLang(html)
  assertOk(htmlLang.length > 0, `${path}: missing html lang attribute`)
  assertOk(
    htmlLang.toLowerCase().startsWith('en'),
    `${path}: unexpected html lang "${htmlLang}" (expected en*)`
  )

  assertOk(hasTag(html, /<meta[^>]+name=["']viewport["'][^>]*>/i), `${path}: missing viewport meta`)
  assertOk(hasTag(html, /<meta[^>]+name=["']robots["'][^>]*>/i), `${path}: missing robots meta`)

  assertOk(hasTag(html, /<meta[^>]+property=["']og:image["'][^>]*>/i), `${path}: missing og:image`)
  assertOk(
    hasTag(html, /<meta[^>]+name=["']twitter:image["'][^>]*>/i),
    `${path}: missing twitter:image`
  )
  assertOk(hasTag(html, /<meta[^>]+property=["']og:title["'][^>]*>/i), `${path}: missing og:title`)
  assertOk(
    hasTag(html, /<meta[^>]+property=["']og:description["'][^>]*>/i),
    `${path}: missing og:description`
  )
  assertOk(
    hasTag(html, /<meta[^>]+name=["']twitter:card["'][^>]*>/i),
    `${path}: missing twitter:card`
  )
  assertOk(hasTag(html, /<h1[\s>]/i), `${path}: missing <h1>`)
  if (requireJsonLd) {
    assertOk(
      hasTag(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i),
      `${path}: missing JSON-LD script`
    )
  }
}

function checkIndexable(path, html) {
  checkCommonHead(path, html)
  assertOk(
    !hasTag(html, /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*["'][^>]*>/i),
    `${path}: unexpectedly noindex`
  )
}

function checkNoindex(path, html) {
  checkCommonHead(path, html)
  assertOk(
    hasTag(
      html,
      /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*follow[^"']*["'][^>]*>/i
    ),
    `${path}: expected robots noindex,follow`
  )
}

async function main() {
  const INDEXABLE_ROUTES = await fetchSitemapRoutes()
  if (INDEXABLE_ROUTES.length === 0) {
    throw new Error('No indexable routes parsed from sitemap.xml')
  }

  const tasks = [
    ...INDEXABLE_ROUTES.map((path) => async () => {
      const { html } = await fetchHtml(path)
      checkIndexable(path, html)
      return `${path}: OK (indexable)`
    }),
    ...NOINDEX_ROUTES.map((path) => async () => {
      const { html } = await fetchHtml(path)
      checkNoindex(path, html)
      return `${path}: OK (noindex)`
    }),
  ]

  const results = []
  for (let i = 0; i < tasks.length; i += maxConcurrency) {
    const batch = tasks.slice(i, i + maxConcurrency)
    const chunk = await Promise.all(batch.map((run) => run()))
    results.push(...chunk)
  }
  for (const line of results) console.log(line)
  console.log(`SEO smoke OK: ${results.length} routes checked @ ${baseUrl}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

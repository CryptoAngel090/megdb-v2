/**
 * SEO regression monitor snapshot.
 *
 * - Fetches key routes, extracts simple SEO signals.
 * - Compares against previous snapshot and fails on major regressions.
 *
 * Env:
 * - SEO_SMOKE_BASE_URL / NEXT_PUBLIC_SITE_URL
 * - SEO_MONITOR_ALLOW_BASE_URL_CHANGE=true (default false)
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fetchSitemapUrlsetUrls } from './sitemap-urlset-utils.mjs'

const baseUrl = (
  process.env.SEO_SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://megdb.com'
).replace(/\/$/, '')
const allowBaseUrlChange = process.env.SEO_MONITOR_ALLOW_BASE_URL_CHANGE === 'true'
const timeoutMs = Number.parseInt(process.env.SEO_MONITOR_TIMEOUT_MS || '15000', 10)
const staticSampleLimit = Number.parseInt(process.env.SEO_MONITOR_STATIC_SAMPLE_LIMIT || '12', 10)
const detailSampleLimit = Number.parseInt(process.env.SEO_MONITOR_DETAIL_SAMPLE_LIMIT || '18', 10)
const facetSampleLimit = Number.parseInt(process.env.SEO_MONITOR_FACET_SAMPLE_LIMIT || '10', 10)
const noindexSampleLimit = Number.parseInt(process.env.SEO_MONITOR_NOINDEX_SAMPLE_LIMIT || '6', 10)
const minStaticCoverage = Number.parseInt(process.env.SEO_MONITOR_MIN_STATIC_COVERAGE || '5', 10)
const minDetailCoverage = Number.parseInt(process.env.SEO_MONITOR_MIN_DETAIL_COVERAGE || '5', 10)
const minFacetCoverage = Number.parseInt(process.env.SEO_MONITOR_MIN_FACET_COVERAGE || '3', 10)
const minNoindexCoverage = Number.parseInt(process.env.SEO_MONITOR_MIN_NOINDEX_COVERAGE || '3', 10)
const allowRouteFallback = (process.env.SEO_MONITOR_ALLOW_ROUTE_FALLBACK || 'true') === 'true'

const staticPriorityRoutes = ['/', '/movies', '/series', '/cartoons', '/tvshows', '/about']
const dir = join(process.cwd(), '.seo')
const snapshotFile = join(dir, 'monitor-snapshot.json')
const policy = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts', 'seo-route-policy.json'), 'utf8')
)

function pick(html, re) {
  const m = html.match(re)
  return m?.[1]?.trim() ?? ''
}

async function collect(path, kind) {
  const url = `${baseUrl}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'megdb-seo-monitor/1.0' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
    const html = await res.text()
    return {
      path,
      kind,
      title: pick(html, /<title>([^<]*)<\/title>/i),
      canonical: pick(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
      hasJsonLd: /application\/ld\+json/i.test(html),
      hasOgUrl: /property=["']og:url["']/i.test(html),
      hasTwitterCard: /name=["']twitter:card["']/i.test(html),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${path}: request timeout after ${timeoutMs}ms (${url})`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function classifyRoute(path) {
  if (/^\/(movie|series|cartoon|tvshow|tvshows)\/[^/]+$/.test(path)) return 'detail'
  if (path.includes('?')) return 'facet'
  return 'static'
}

function dedupe(list) {
  return Array.from(new Set(list))
}

function normalizeKind(value, path) {
  if (value === 'static' || value === 'detail' || value === 'facet' || value === 'noindex')
    return value
  return classifyRoute(path)
}

function buildFallbackRoutePlan(prev) {
  const fromPrev = {
    static: [],
    detail: [],
    facet: [],
    noindex: [],
  }
  if (prev?.pages && Array.isArray(prev.pages)) {
    for (const page of prev.pages) {
      if (!page?.path || typeof page.path !== 'string') continue
      const kind = normalizeKind(page.kind, page.path)
      fromPrev[kind].push(page.path)
    }
  }

  const seedNoindex = policy.noindexRoutes.filter((route) => !route.includes('['))
  const staticRoutes = dedupe([...staticPriorityRoutes, ...fromPrev.static]).slice(
    0,
    Math.max(1, staticSampleLimit)
  )
  const detailRoutes = dedupe(fromPrev.detail).slice(0, Math.max(1, detailSampleLimit))
  const facetRoutes = dedupe(fromPrev.facet).slice(0, Math.max(1, facetSampleLimit))
  const noindexRoutes = dedupe([...seedNoindex, ...fromPrev.noindex]).slice(
    0,
    Math.max(1, noindexSampleLimit)
  )

  return {
    static: staticRoutes,
    detail: detailRoutes,
    facet: facetRoutes,
    noindex: noindexRoutes,
  }
}

function makeCoverage(pages) {
  const coverage = {
    static: 0,
    detail: 0,
    facet: 0,
    noindex: 0,
  }
  for (const page of pages) {
    if (page.kind in coverage) coverage[page.kind] += 1
  }
  return coverage
}

function assertCoverage(coverage, mode = 'full') {
  if (mode === 'degraded') return
  const requiredDetail = Math.max(1, minDetailCoverage)
  const requiredFacet = Math.max(1, minFacetCoverage)
  assert(
    coverage.static >= Math.max(1, minStaticCoverage),
    `Coverage too low: static ${coverage.static} < ${Math.max(1, minStaticCoverage)}`
  )
  assert(
    coverage.detail >= requiredDetail,
    `Coverage too low: detail ${coverage.detail} < ${requiredDetail}`
  )
  assert(
    coverage.facet >= requiredFacet,
    `Coverage too low: facet ${coverage.facet} < ${requiredFacet}`
  )
  assert(
    coverage.noindex >= Math.max(1, minNoindexCoverage),
    `Coverage too low: noindex ${coverage.noindex} < ${Math.max(1, minNoindexCoverage)}`
  )
}

async function buildMonitorRoutePlan() {
  const rawUrls = await fetchSitemapUrlsetUrls({
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    timeoutMs,
    maxUrls: 400,
    maxSitemaps: 100,
    userAgent: 'megdb-seo-monitor/1.0',
  })

  const byClass = {
    static: [],
    detail: [],
    facet: [],
  }
  for (const raw of rawUrls) {
    try {
      const u = new URL(raw)
      if (u.origin !== baseUrl) continue
      const path = `${u.pathname}${u.search || ''}`
      const type = classifyRoute(path)
      byClass[type].push(path)
    } catch {
      // ignore malformed url
    }
  }

  const orderedStatic = [
    ...staticPriorityRoutes,
    ...byClass.static.filter((p) => !staticPriorityRoutes.includes(p)),
  ]
  const staticRoutes = orderedStatic.slice(0, Math.max(1, staticSampleLimit))
  const detailRoutes = byClass.detail.slice(0, Math.max(1, detailSampleLimit))
  const facetRoutes = byClass.facet.slice(0, Math.max(1, facetSampleLimit))
  const noindexRoutes = policy.noindexRoutes
    .filter((route) => !route.includes('['))
    .slice(0, Math.max(1, noindexSampleLimit))

  return {
    static: dedupe(staticRoutes),
    detail: dedupe(detailRoutes),
    facet: dedupe(facetRoutes),
    noindex: dedupe(noindexRoutes),
  }
}

function loadSnapshot() {
  try {
    return JSON.parse(readFileSync(snapshotFile, 'utf8'))
  } catch {
    return null
  }
}

function saveSnapshot(data) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(snapshotFile, JSON.stringify(data, null, 2), 'utf8')
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function compare(prev, next) {
  if (!allowBaseUrlChange) {
    assert(prev.baseUrl === next.baseUrl, `Base URL changed: ${prev.baseUrl} -> ${next.baseUrl}`)
  }

  if (prev.coverage && next.mode !== 'degraded') {
    assert(
      next.coverage.static >= prev.coverage.static,
      `Coverage regressed: static ${prev.coverage.static} -> ${next.coverage.static}`
    )
    assert(
      next.coverage.detail >= prev.coverage.detail,
      `Coverage regressed: detail ${prev.coverage.detail} -> ${next.coverage.detail}`
    )
    assert(
      next.coverage.facet >= prev.coverage.facet,
      `Coverage regressed: facet ${prev.coverage.facet} -> ${next.coverage.facet}`
    )
    assert(
      next.coverage.noindex >= prev.coverage.noindex,
      `Coverage regressed: noindex ${prev.coverage.noindex} -> ${next.coverage.noindex}`
    )
  }

  const byPathPrev = new Map(prev.pages.map((p) => [p.path, p]))
  for (const page of next.pages) {
    const old = byPathPrev.get(page.path)
    if (!old) continue
    assert(page.title.length >= 3, `${page.path}: title too short`)
    assert(page.canonical.length > 0, `${page.path}: canonical missing`)
    assert(page.hasJsonLd, `${page.path}: JSON-LD missing`)
    assert(page.hasOgUrl, `${page.path}: og:url missing`)
    assert(page.hasTwitterCard, `${page.path}: twitter:card missing`)
    // hard regressions only
    assert(old.hasJsonLd || page.hasJsonLd, `${page.path}: regressed JSON-LD`)
    assert(old.hasOgUrl || page.hasOgUrl, `${page.path}: regressed og:url`)
    assert(old.hasTwitterCard || page.hasTwitterCard, `${page.path}: regressed twitter:card`)
  }
}

async function main() {
  const prev = loadSnapshot()
  let plan
  let mode = 'full'
  try {
    plan = await buildMonitorRoutePlan()
  } catch (error) {
    if (!allowRouteFallback) throw error
    mode = 'degraded'
    plan = buildFallbackRoutePlan(prev)
    const msg = error instanceof Error ? error.message : String(error)
    console.warn(`[warn] SEO monitor degraded mode: sitemap unavailable (${msg})`)
  }

  const routes = dedupe([...plan.static, ...plan.detail, ...plan.facet, ...plan.noindex])
  assert(routes.length > 0, 'SEO monitor has no routes to check (full and fallback plan empty)')
  const kindByPath = new Map()
  for (const path of plan.static) kindByPath.set(path, 'static')
  for (const path of plan.detail) kindByPath.set(path, 'detail')
  for (const path of plan.facet) kindByPath.set(path, 'facet')
  for (const path of plan.noindex) kindByPath.set(path, 'noindex')
  const pages = []
  const failures = []
  for (const path of routes) {
    try {
      pages.push(await collect(path, kindByPath.get(path) || classifyRoute(path)))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ path, message })
      console.warn(`[warn] monitor fetch failed: ${message}`)
    }
  }
  if (mode !== 'degraded' && failures.length > 0) {
    throw new Error(`SEO monitor failed: ${failures.length} route fetch error(s) in full mode`)
  }
  const coverage = makeCoverage(pages)
  if (mode === 'degraded' && pages.length === 0) {
    console.warn(
      '[warn] SEO monitor degraded mode: all route fetches failed, keeping previous snapshot unchanged.'
    )
    const fallbackSnapshot = {
      at: new Date().toISOString(),
      baseUrl,
      mode,
      coverage: prev?.coverage || { static: 0, detail: 0, facet: 0, noindex: 0 },
      pages: prev?.pages || [],
      degradedNoFetch: true,
    }
    saveSnapshot(fallbackSnapshot)
    console.log('SEO monitor OK: degraded network fallback completed with 0 successful fetches.')
    return
  }
  assertCoverage(coverage, mode)
  const next = { at: new Date().toISOString(), baseUrl, mode, coverage, pages }

  if (prev) compare(prev, next)

  saveSnapshot(next)
  console.log(
    `SEO monitor OK: ${pages.length} routes checked (mode=${mode}, static=${coverage.static}, detail=${coverage.detail}, facet=${coverage.facet}, noindex=${coverage.noindex}), snapshot updated.`
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})

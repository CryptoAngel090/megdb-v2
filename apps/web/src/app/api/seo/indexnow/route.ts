import { NextRequest, NextResponse } from 'next/server'
import { runIndexNowPipeline } from '@/lib/indexnowPipeline'
import { SITE_URL } from '@/lib/site'

export const runtime = 'nodejs'

const INDEXNOW_ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow'
const INDEXNOW_BATCH_SIZE = Number.parseInt(process.env.INDEXNOW_BATCH_SIZE || '10000', 10)
const INDEXNOW_MAX_ATTEMPTS = Number.parseInt(process.env.INDEXNOW_MAX_ATTEMPTS || '3', 10)
const INDEXNOW_RETRY_BASE_MS = Number.parseInt(process.env.INDEXNOW_RETRY_BASE_MS || '750', 10)
const INDEXNOW_TIMEOUT_MS = Number.parseInt(process.env.INDEXNOW_TIMEOUT_MS || '15000', 10)
const INDEXNOW_SITEMAP_MAX_URLS = Number.parseInt(
  process.env.INDEXNOW_SITEMAP_MAX_URLS || '50000',
  10
)
const INDEXNOW_SITEMAP_MAX_FILES = Number.parseInt(
  process.env.INDEXNOW_SITEMAP_MAX_FILES || '50',
  10
)

function readBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  const m = auth.match(/^Bearer\s+(.+)$/i)
  return m?.[1] ?? null
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return { controller, timer }
}

async function fetchText(url: string): Promise<string> {
  const { controller, timer } = withTimeoutSignal(INDEXNOW_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'megdb-indexnow-trigger/1.0' },
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`)
    return await res.text()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${INDEXNOW_TIMEOUT_MS}ms (${url})`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function parseLocs(xml: string): string[] {
  const locRe = /<loc>\s*([^<\s]+)\s*<\/loc>/gim
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = locRe.exec(xml)) != null) {
    const loc = m[1]
    if (loc) out.push(loc.trim())
  }
  return out
}

async function readSitemapUrls(site: string): Promise<string[]> {
  const queue = [`${site.replace(/\/$/, '')}/sitemap.xml`]
  const visited = new Set<string>()
  const urls: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)
    if (visited.size > INDEXNOW_SITEMAP_MAX_FILES) break

    const xml = await fetchText(current)
    const locs = parseLocs(xml)
    const isIndex = /<sitemapindex[\s>]/i.test(xml)

    for (const loc of locs) {
      if (isIndex) {
        queue.push(loc)
        continue
      }
      urls.push(loc)
      if (urls.length >= INDEXNOW_SITEMAP_MAX_URLS) break
    }
    if (urls.length >= INDEXNOW_SITEMAP_MAX_URLS) break
  }

  return Array.from(new Set(urls))
}

/**
 * Protected manual trigger for IndexNow, submits all URLs from sitemap.xml.
 *
 * Auth:
 * - Header `Authorization: Bearer <INDEXNOW_TRIGGER_TOKEN>`
 *
 * Env required:
 * - INDEXNOW_TRIGGER_TOKEN
 * - INDEXNOW_KEY
 *
 * Optional env:
 * - INDEXNOW_ENDPOINT
 * - INDEXNOW_KEY_LOCATION (default: <SITE_URL>/indexnow-key)
 * - NEXT_PUBLIC_SITE_URL (affects SITE_URL)
 */
export async function POST(request: NextRequest) {
  const triggerToken = process.env.INDEXNOW_TRIGGER_TOKEN?.trim()
  const incoming = readBearerToken(request)
  if (!triggerToken || !incoming || incoming !== triggerToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key) {
    return NextResponse.json({ error: 'INDEXNOW_KEY is not configured' }, { status: 500 })
  }

  const site = SITE_URL.replace(/\/$/, '')
  const keyLocation = process.env.INDEXNOW_KEY_LOCATION || `${site}/indexnow-key`

  try {
    const urls = await readSitemapUrls(site)
    if (urls.length === 0) {
      return NextResponse.json({ ok: false, error: 'No URLs in sitemap.xml' }, { status: 500 })
    }

    const host = new URL(site).host
    const pipeline = await runIndexNowPipeline({
      urls,
      batchSize: INDEXNOW_BATCH_SIZE,
      maxAttempts: INDEXNOW_MAX_ATTEMPTS,
      initialBackoffMs: INDEXNOW_RETRY_BASE_MS,
      submitBatch: async (batch) => {
        const payload = {
          host,
          key,
          keyLocation,
          urlList: batch,
        }
        const { controller, timer } = withTimeoutSignal(INDEXNOW_TIMEOUT_MS)
        const submit = await fetch(INDEXNOW_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
          cache: 'no-store',
          signal: controller.signal,
        }).finally(() => clearTimeout(timer))
        if (!submit.ok) {
          const body = await submit.text().catch(() => '')
          throw new Error(`IndexNow submit failed (${submit.status}): ${body.slice(0, 500)}`)
        }
      },
    })

    if (pipeline.failedUrls > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'IndexNow pipeline completed with failed batches',
          site,
          endpoint: INDEXNOW_ENDPOINT,
          pipeline,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      submitted: pipeline.submittedUrls,
      endpoint: INDEXNOW_ENDPOINT,
      site,
      pipeline,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

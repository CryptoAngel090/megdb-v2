import { fetchSitemapUrlsetUrls } from './sitemap-urlset-utils.mjs'

/**
 * Submit sitemap URLs to IndexNow (Bing/Copilot and other adopters).
 *
 * Required env:
 * - INDEXNOW_KEY
 *
 * Optional env:
 * - NEXT_PUBLIC_SITE_URL (default: https://megdb.com)
 * - INDEXNOW_ENDPOINT (default: https://api.indexnow.org/indexnow)
 * - INDEXNOW_KEY_LOCATION (default: <site>/indexnow-key)
 *
 * Flags:
 * - --site <url>     Override site URL
 * - --dry-run        Parse and print stats, do not submit
 */

const args = process.argv.slice(2)
const getFlag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const hasFlag = (name) => args.includes(name)

const site = (getFlag('--site') || process.env.NEXT_PUBLIC_SITE_URL || 'https://megdb.com').replace(
  /\/$/,
  ''
)
const endpoint = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow'
const key = process.env.INDEXNOW_KEY
const keyLocation = process.env.INDEXNOW_KEY_LOCATION || `${site}/indexnow-key`
const dryRun = hasFlag('--dry-run')
const batchSizeRaw = Number.parseInt(process.env.INDEXNOW_BATCH_SIZE || '10000', 10)
const maxAttemptsRaw = Number.parseInt(process.env.INDEXNOW_MAX_ATTEMPTS || '3', 10)
const retryBaseMsRaw = Number.parseInt(process.env.INDEXNOW_RETRY_BASE_MS || '750', 10)
const batchSize = Number.isFinite(batchSizeRaw) ? Math.max(1, batchSizeRaw) : 10000
const maxAttempts = Number.isFinite(maxAttemptsRaw) ? Math.max(1, maxAttemptsRaw) : 3
const retryBaseMs = Number.isFinite(retryBaseMsRaw) ? Math.max(0, retryBaseMsRaw) : 750

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function normalizeAndDedupe(urls) {
  const seen = new Set()
  const out = []
  for (const url of urls) {
    const raw = String(url || '').trim()
    if (!raw) continue
    try {
      const parsed = new URL(raw)
      parsed.hash = ''
      const normalized = parsed.toString()
      if (seen.has(normalized)) continue
      seen.add(normalized)
      out.push(normalized)
    } catch {
      // ignore invalid URLs
    }
  }
  return out
}

function chunk(items, size) {
  const out = []
  const safeSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : 10000
  for (let i = 0; i < items.length; i += safeSize) out.push(items.slice(i, i + safeSize))
  return out
}

async function readSitemapUrls() {
  return fetchSitemapUrlsetUrls({
    sitemapUrl: `${site}/sitemap.xml`,
    timeoutMs: Number.parseInt(process.env.INDEXNOW_SITEMAP_TIMEOUT_MS || '15000', 10),
    maxUrls: Number.parseInt(process.env.INDEXNOW_SITEMAP_MAX_URLS || '50000', 10),
    userAgent: 'megdb-indexnow-submit/1.0',
  })
}

async function main() {
  const urls = normalizeAndDedupe(await readSitemapUrls())
  if (urls.length === 0) throw new Error('No URLs found in sitemap.xml')

  if (dryRun) {
    console.log(`[dry-run] Site: ${site}`)
    console.log(`[dry-run] Endpoint: ${endpoint}`)
    console.log(`[dry-run] URLs parsed: ${urls.length}`)
    console.log(`[dry-run] First 5 URLs:`)
    for (const u of urls.slice(0, 5)) console.log(`- ${u}`)
    return
  }

  if (!key) {
    throw new Error('INDEXNOW_KEY is required (or use --dry-run)')
  }

  const host = new URL(site).host
  const batches = chunk(urls, batchSize)
  let submittedUrls = 0

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    let success = false
    let lastError = ''
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const payload = {
        host,
        key,
        keyLocation,
        urlList: batch,
      }

      const submit = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      })

      if (submit.ok) {
        success = true
        submittedUrls += batch.length
        console.log(`IndexNow batch ${batchIndex + 1}/${batches.length} OK (${batch.length} urls)`)
        break
      }

      const body = await submit.text().catch(() => '')
      lastError = `IndexNow submit failed (${submit.status}): ${body.slice(0, 500)}`
      if (attempt < maxAttempts) {
        const backoff = retryBaseMs * 2 ** (attempt - 1)
        await sleep(backoff)
      }
    }

    if (!success) {
      throw new Error(
        `Batch ${batchIndex + 1}/${batches.length} failed after retries: ${lastError}`
      )
    }
  }

  console.log(
    `IndexNow submit OK: ${submittedUrls} URLs in ${batches.length} batches -> ${endpoint}`
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

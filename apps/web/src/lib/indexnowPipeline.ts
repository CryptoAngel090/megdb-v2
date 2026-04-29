type IndexNowSubmitBatch = (urls: string[]) => Promise<void>

type IndexNowPipelineOptions = {
  urls: string[]
  submitBatch: IndexNowSubmitBatch
  batchSize?: number
  maxAttempts?: number
  initialBackoffMs?: number
  sleep?: (ms: number) => Promise<void>
}

type IndexNowPipelineBatchResult = {
  batchIndex: number
  size: number
  attempts: number
  ok: boolean
  error?: string
}

type IndexNowPipelineResult = {
  totalUrls: number
  uniqueUrls: number
  submittedUrls: number
  failedUrls: number
  batches: IndexNowPipelineBatchResult[]
}

const DEFAULT_BATCH_SIZE = 10_000
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_INITIAL_BACKOFF_MS = 750

const sleepDefault = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function normalizeUrl(url: string): string | null {
  const raw = url.trim()
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return null
  }
}

export function normalizeAndDedupeUrls(urls: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const url of urls) {
    const normalized = normalizeUrl(url)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function runIndexNowPipeline(
  opts: IndexNowPipelineOptions
): Promise<IndexNowPipelineResult> {
  const rawBatchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE
  const rawMaxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const rawBackoff = opts.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS
  const batchSize = Number.isFinite(rawBatchSize)
    ? Math.max(1, Math.floor(rawBatchSize))
    : DEFAULT_BATCH_SIZE
  const maxAttempts = Number.isFinite(rawMaxAttempts)
    ? Math.max(1, Math.floor(rawMaxAttempts))
    : DEFAULT_MAX_ATTEMPTS
  const initialBackoffMs = Number.isFinite(rawBackoff)
    ? Math.max(0, rawBackoff)
    : DEFAULT_INITIAL_BACKOFF_MS
  const sleep = opts.sleep ?? sleepDefault

  const uniqueUrls = normalizeAndDedupeUrls(opts.urls)
  const batches = chunk(uniqueUrls, batchSize)
  const results: IndexNowPipelineBatchResult[] = []

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    if (!batch) continue
    let ok = false
    let attempts = 0
    let error: string | undefined

    while (attempts < maxAttempts) {
      attempts += 1
      try {
        await opts.submitBatch(batch)
        ok = true
        error = undefined
        break
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
        if (attempts < maxAttempts) {
          const backoff = initialBackoffMs * 2 ** (attempts - 1)
          await sleep(backoff)
        }
      }
    }

    if (ok) {
      results.push({
        batchIndex,
        size: batch.length,
        attempts,
        ok: true,
      })
    } else {
      results.push({
        batchIndex,
        size: batch.length,
        attempts,
        ok: false,
        error: error ?? 'Unknown IndexNow batch error',
      })
    }
  }

  const submittedUrls = results.filter((r) => r.ok).reduce((acc, r) => acc + r.size, 0)
  return {
    totalUrls: opts.urls.length,
    uniqueUrls: uniqueUrls.length,
    submittedUrls,
    failedUrls: uniqueUrls.length - submittedUrls,
    batches: results,
  }
}

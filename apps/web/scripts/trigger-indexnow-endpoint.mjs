/**
 * Trigger server-side IndexNow submit endpoint.
 *
 * Required env:
 * - INDEXNOW_TRIGGER_TOKEN
 *
 * Optional env:
 * - INDEXNOW_TRIGGER_URL (default: <site>/api/seo/indexnow)
 * - NEXT_PUBLIC_SITE_URL (default site: https://megdb.com)
 *
 * Flags:
 * - --url <endpoint>
 * - --dry-run
 */

const args = process.argv.slice(2)
const getFlag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const hasFlag = (name) => args.includes(name)

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://megdb.com').replace(/\/$/, '')
const endpoint = getFlag('--url') || process.env.INDEXNOW_TRIGGER_URL || `${site}/api/seo/indexnow`
const token = process.env.INDEXNOW_TRIGGER_TOKEN?.trim()
const dryRun = hasFlag('--dry-run')

async function main() {
  if (dryRun) {
    console.log(`[dry-run] endpoint: ${endpoint}`)
    console.log(`[dry-run] token configured: ${Boolean(token)}`)
    return
  }

  if (!token) {
    throw new Error('INDEXNOW_TRIGGER_TOKEN is required')
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  const body = await res.text()
  if (!res.ok) {
    throw new Error(`Trigger failed (${res.status}): ${body.slice(0, 500)}`)
  }

  console.log(body)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

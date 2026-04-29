import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function parseNumberArg(name, fallback) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (!raw) return fallback
  const value = Number(raw.slice(name.length + 1))
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${name} value: ${raw}`)
  }
  return value
}

function parseStringArg(name, fallback) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (!raw) return fallback
  return raw.slice(name.length + 1)
}

function formatBytes(bytes) {
  return `${bytes} B (${(bytes / 1024).toFixed(2)} KiB)`
}

function main() {
  const reportPathArg = parseStringArg('--report', '.seo/route-chunks/_detail_movie_[id]_page.json')
  const maxTotalBytes = parseNumberArg('--max-total-bytes', 210000)
  const maxSharedBytes = parseNumberArg('--max-shared-bytes', 90000)
  const maxFirstPartyBytes = parseNumberArg('--max-first-party-bytes', 140000)

  const reportPath = resolve(reportPathArg)
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))

  const checks = [
    {
      label: 'totalBytes',
      actual: Number(report.totalBytes ?? 0),
      max: maxTotalBytes,
    },
    {
      label: 'sharedBytes',
      actual: Number(report.sharedBytes ?? 0),
      max: maxSharedBytes,
    },
    {
      label: 'firstPartyBytes',
      actual: Number(report.firstPartyBytes ?? 0),
      max: maxFirstPartyBytes,
    },
  ]

  console.log(`[route-budget] report=${reportPath}`)
  console.log(`[route-budget] route=${String(report.route ?? 'unknown')}`)

  const failures = []
  for (const check of checks) {
    const ok = check.actual <= check.max
    const status = ok ? 'PASS' : 'FAIL'
    console.log(
      `[route-budget] ${status} ${check.label}: actual=${formatBytes(check.actual)} max=${formatBytes(check.max)}`
    )
    if (!ok) failures.push(check)
  }

  if (failures.length > 0) {
    throw new Error(
      `Route chunk budget failed (${failures.length} threshold violation${failures.length > 1 ? 's' : ''})`
    )
  }
}

main()

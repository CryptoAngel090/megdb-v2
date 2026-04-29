import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const reportsDir = join(process.cwd(), '.seo', 'reports')
const monitorSnapshotPath = join(process.cwd(), '.seo', 'monitor-snapshot.json')
const webmasterLoopPath = join(process.cwd(), '.seo', 'webmaster-loop.json')

const warnBudget = Number.parseInt(process.env.SEO_WEEKLY_WARN_BUDGET || '2', 10)
const maxDuplicateTitles = Number.parseInt(process.env.SEO_WEEKLY_MAX_DUPLICATE_TITLES || '0', 10)
const maxMissingCanonical = Number.parseInt(process.env.SEO_WEEKLY_MAX_MISSING_CANONICAL || '0', 10)
const maxMissingJsonLd = Number.parseInt(process.env.SEO_WEEKLY_MAX_MISSING_JSONLD || '0', 10)
const minStaticCoverage = Number.parseInt(process.env.SEO_WEEKLY_MIN_STATIC_COVERAGE || '5', 10)
const minDetailCoverage = Number.parseInt(process.env.SEO_WEEKLY_MIN_DETAIL_COVERAGE || '5', 10)
const minNoindexCoverage = Number.parseInt(process.env.SEO_WEEKLY_MIN_NOINDEX_COVERAGE || '3', 10)
const maxWebmasterAgeDays = Number.parseInt(
  process.env.SEO_WEEKLY_MAX_WEBMASTER_AGE_DAYS || '7',
  10
)
const dryRun = process.argv.includes('--dry-run')

const checks = [
  {
    id: 'verify:seo:full',
    command: 'pnpm',
    args: ['run', 'verify:seo:full'],
    severity: 'fail',
  },
  {
    id: 'verify:seo:monitor',
    command: 'pnpm',
    args: ['run', 'verify:seo:monitor'],
    severity: 'fail',
  },
  {
    id: 'verify:seo:smoke',
    command: 'pnpm',
    args: ['run', 'verify:seo:smoke'],
    severity: 'warn',
  },
  {
    id: 'seo:webmaster:status',
    command: 'pnpm',
    args: ['run', 'seo:webmaster:status'],
    severity: 'warn',
  },
]

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function ageDays(iso) {
  if (!iso) return Number.POSITIVE_INFINITY
  const ageMs = Date.now() - new Date(iso).getTime()
  return ageMs / (1000 * 60 * 60 * 24)
}

function runCheck(def) {
  if (dryRun) {
    return {
      id: def.id,
      severity: def.severity,
      ok: true,
      skipped: true,
      exitCode: 0,
      elapsedMs: 0,
      stdout: '',
      stderr: '',
    }
  }
  const startedAt = Date.now()
  const proc = spawnSync(def.command, def.args, {
    encoding: 'utf8',
    shell: true,
    cwd: process.cwd(),
    env: process.env,
  })
  const elapsedMs = Date.now() - startedAt
  return {
    id: def.id,
    severity: def.severity,
    ok: proc.status === 0,
    skipped: false,
    exitCode: proc.status ?? 1,
    elapsedMs,
    stdout: (proc.stdout || '').trim(),
    stderr: (proc.stderr || '').trim(),
  }
}

function getDuplicateTitleCount(pages) {
  const counts = new Map()
  for (const page of pages) {
    const key = (page?.title || '').trim().toLowerCase()
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  let duplicates = 0
  for (const count of counts.values()) {
    if (count > 1) duplicates += 1
  }
  return duplicates
}

function assessSignals() {
  const monitor = readJson(monitorSnapshotPath)
  const webmaster = readJson(webmasterLoopPath)
  const pages = Array.isArray(monitor?.pages) ? monitor.pages : []
  const coverage = monitor?.coverage || {}
  const monitorCoverageTotal =
    (coverage.static || 0) + (coverage.detail || 0) + (coverage.noindex || 0)
  const hasMonitorSample = pages.length > 0 || monitorCoverageTotal > 0
  const monitorSeverity = hasMonitorSample ? 'fail' : dryRun ? 'warn' : 'fail'

  const duplicateTitles = getDuplicateTitleCount(pages)
  const missingCanonical = pages.filter((p) => !p?.canonical).length
  const missingJsonLd = pages.filter((p) => !p?.hasJsonLd).length
  const webmasterAge = ageDays(webmaster?.at)

  const signalRows = [
    {
      id: 'monitor.duplicate_titles',
      severity: monitorSeverity,
      value: duplicateTitles,
      threshold: `<= ${maxDuplicateTitles}`,
      ok: hasMonitorSample ? duplicateTitles <= maxDuplicateTitles : dryRun,
      message: hasMonitorSample
        ? `${duplicateTitles} duplicate titles in monitor sample`
        : 'monitor snapshot missing in dry-run, skipping strict duplicate-title gate',
    },
    {
      id: 'monitor.missing_canonical',
      severity: monitorSeverity,
      value: missingCanonical,
      threshold: `<= ${maxMissingCanonical}`,
      ok: hasMonitorSample ? missingCanonical <= maxMissingCanonical : dryRun,
      message: hasMonitorSample
        ? `${missingCanonical} routes with missing canonical`
        : 'monitor snapshot missing in dry-run, skipping strict canonical gate',
    },
    {
      id: 'monitor.missing_jsonld',
      severity: monitorSeverity,
      value: missingJsonLd,
      threshold: `<= ${maxMissingJsonLd}`,
      ok: hasMonitorSample ? missingJsonLd <= maxMissingJsonLd : dryRun,
      message: hasMonitorSample
        ? `${missingJsonLd} routes with missing JSON-LD`
        : 'monitor snapshot missing in dry-run, skipping strict JSON-LD gate',
    },
    {
      id: 'monitor.coverage_static',
      severity: monitorSeverity,
      value: coverage.static || 0,
      threshold: `>= ${minStaticCoverage}`,
      ok: hasMonitorSample ? (coverage.static || 0) >= minStaticCoverage : dryRun,
      message: hasMonitorSample
        ? `static coverage ${coverage.static || 0}`
        : 'monitor snapshot missing in dry-run, skipping strict static coverage gate',
    },
    {
      id: 'monitor.coverage_detail',
      severity: monitorSeverity,
      value: coverage.detail || 0,
      threshold: `>= ${minDetailCoverage}`,
      ok: hasMonitorSample ? (coverage.detail || 0) >= minDetailCoverage : dryRun,
      message: hasMonitorSample
        ? `detail coverage ${coverage.detail || 0}`
        : 'monitor snapshot missing in dry-run, skipping strict detail coverage gate',
    },
    {
      id: 'monitor.coverage_noindex',
      severity: monitorSeverity,
      value: coverage.noindex || 0,
      threshold: `>= ${minNoindexCoverage}`,
      ok: hasMonitorSample ? (coverage.noindex || 0) >= minNoindexCoverage : dryRun,
      message: hasMonitorSample
        ? `noindex coverage ${coverage.noindex || 0}`
        : 'monitor snapshot missing in dry-run, skipping strict noindex coverage gate',
    },
    {
      id: 'webmaster.age_days',
      severity: 'warn',
      value: Number.isFinite(webmasterAge) ? Number(webmasterAge.toFixed(1)) : null,
      threshold: `<= ${maxWebmasterAgeDays}`,
      ok: webmasterAge <= maxWebmasterAgeDays,
      message: Number.isFinite(webmasterAge)
        ? `webmaster evidence is ${webmasterAge.toFixed(1)} days old`
        : 'webmaster evidence missing',
    },
  ]

  return { monitorMode: monitor?.mode || 'missing', signalRows }
}

function writeReport(report) {
  mkdirSync(reportsDir, { recursive: true })
  const latest = join(reportsDir, 'weekly-latest.json')
  const stamped = join(reportsDir, `weekly-${nowStamp()}.json`)
  const body = JSON.stringify(report, null, 2)
  writeFileSync(latest, body, 'utf8')
  writeFileSync(stamped, body, 'utf8')
  return { latest, stamped }
}

function printResult(row) {
  const prefix = row.ok ? 'OK' : row.severity === 'warn' ? 'WARN' : 'FAIL'
  console.log(`[${prefix}] ${row.id}${row.message ? ` — ${row.message}` : ''}`)
}

function main() {
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()

  const checkResults = checks.map((check) => runCheck(check))
  for (const row of checkResults) printResult(row)

  const { monitorMode, signalRows } = assessSignals()
  for (const row of signalRows) printResult(row)

  const allRows = [...checkResults, ...signalRows]
  const failRows = allRows.filter((r) => r.severity === 'fail' && !r.ok)
  const warnRows = allRows.filter((r) => r.severity === 'warn' && !r.ok)
  const ok = failRows.length === 0 && warnRows.length <= Math.max(0, warnBudget)

  const report = {
    version: 1,
    suite: 'seo-weekly-audit',
    dryRun,
    ok,
    warnBudget,
    monitorMode,
    startedAt,
    finishedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedMs,
    checks: checkResults,
    signals: signalRows,
    failedCount: failRows.length,
    warnedCount: warnRows.length,
  }

  const files = writeReport(report)
  console.log(`Weekly SEO report written: ${files.latest}`)
  if (failRows.length > 0) {
    console.error(
      `Weekly SEO audit failed (${failRows.length} fail checks). Report: ${files.stamped}`
    )
    process.exit(1)
  }
  if (warnRows.length > warnBudget) {
    console.error(
      `Weekly SEO audit exceeded warning budget (${warnRows.length} > ${warnBudget}). Report: ${files.stamped}`
    )
    process.exit(1)
  }
  if (warnRows.length > 0) {
    console.warn(`Weekly SEO audit passed with warnings (${warnRows.length}/${warnBudget}).`)
  } else {
    console.log('Weekly SEO audit passed.')
  }
}

main()

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const reportsDir = join(process.cwd(), '.seo', 'reports')
const monitorSnapshotPath = join(process.cwd(), '.seo', 'monitor-snapshot.json')
const isCi = process.env.CI === 'true'
const requireSmoke = (process.env.SEO_NIGHTLY_REQUIRE_SMOKE ?? (isCi ? 'true' : 'false')) === 'true'
const requireMonitor =
  (process.env.SEO_NIGHTLY_REQUIRE_MONITOR ?? (isCi ? 'true' : 'false')) === 'true'

const checks = [
  {
    id: 'verify:seo:full',
    command: 'pnpm',
    args: ['run', 'verify:seo:full'],
    required: true,
  },
  {
    id: 'verify:seo:monitor',
    command: 'pnpm',
    args: ['run', 'verify:seo:monitor'],
    required: requireMonitor,
  },
  {
    id: 'verify:seo:smoke',
    command: 'pnpm',
    args: ['run', 'verify:seo:smoke'],
    required: requireSmoke,
  },
]

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function runCheck(def) {
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
    required: def.required,
    ok: proc.status === 0,
    exitCode: proc.status ?? 1,
    elapsedMs,
    stdout: (proc.stdout || '').trim(),
    stderr: (proc.stderr || '').trim(),
  }
}

function writeArtifacts(report) {
  mkdirSync(reportsDir, { recursive: true })
  const latest = join(reportsDir, 'nightly-latest.json')
  const stamped = join(reportsDir, `nightly-${nowStamp()}.json`)
  const body = JSON.stringify(report, null, 2)
  writeFileSync(latest, body, 'utf8')
  writeFileSync(stamped, body, 'utf8')
  return { latest, stamped }
}

function readMonitorMode() {
  try {
    const raw = readFileSync(monitorSnapshotPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed?.mode === 'full' || parsed?.mode === 'degraded') return parsed.mode
    return 'unknown'
  } catch {
    return 'missing'
  }
}

function printAlert(report, reportPath) {
  const requiredFailed = report.checks.filter((c) => c.required && !c.ok)
  const degradedMonitor = report.monitorMode === 'degraded'
  if (requiredFailed.length === 0 && !degradedMonitor) return
  console.error('')
  console.error('=== SEO NIGHTLY ALERT ===')
  console.error(`Failed required checks: ${requiredFailed.length}`)
  if (degradedMonitor) {
    console.error('- verify:seo:monitor ran in degraded mode (network fallback)')
  }
  for (const row of requiredFailed) {
    console.error(`- ${row.id} (exit=${row.exitCode})`)
  }
  console.error(`monitor_mode=${report.monitorMode}`)
  console.error(`Report: ${reportPath}`)
  console.error('=========================')
}

function main() {
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()
  const results = []

  for (const check of checks) {
    const result = runCheck(check)
    results.push(result)
    const status = result.ok ? 'OK' : check.required ? 'FAIL' : 'WARN'
    console.log(`[${status}] ${check.id} (${result.elapsedMs}ms)`)
    if (!result.ok && check.required) break
  }

  const ok = results.every((r) => !r.required || r.ok)
  const monitorMode = readMonitorMode()
  const report = {
    version: 1,
    suite: 'seo-nightly',
    ok,
    monitorMode,
    startedAt,
    finishedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedMs,
    checks: results,
  }

  const files = writeArtifacts(report)
  console.log(`Nightly SEO report written: ${files.latest}`)
  console.log(`monitor_mode=${monitorMode}`)
  printAlert(report, files.stamped)
  if (!ok) process.exit(1)
}

main()

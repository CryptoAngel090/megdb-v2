import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const checks = [
  { id: 'contracts', command: 'pnpm', args: ['run', 'verify:seo:contracts'] },
  { id: 'jsonld', command: 'pnpm', args: ['run', 'verify:jsonld'] },
  { id: 'infra', command: 'pnpm', args: ['run', 'verify:seo:infra'] },
  { id: 'noindex', command: 'pnpm', args: ['run', 'verify:seo:noindex'] },
  { id: 'sitemap', command: 'pnpm', args: ['run', 'verify:seo:sitemap'] },
  { id: 'schema', command: 'pnpm', args: ['run', 'verify:seo:schema'] },
  { id: 'freshness-eeat', command: 'pnpm', args: ['run', 'verify:seo:freshness-eeat'] },
  { id: 'canonical', command: 'pnpm', args: ['run', 'verify:seo:canonical'] },
  { id: 'consistency', command: 'pnpm', args: ['run', 'verify:seo:consistency'] },
  { id: 'crawl-budget', command: 'pnpm', args: ['run', 'verify:seo:crawl-budget'] },
  { id: 'links', command: 'pnpm', args: ['run', 'verify:seo:links'] },
  { id: 'programmatic', command: 'pnpm', args: ['run', 'verify:seo:programmatic'] },
  { id: 'scaffold', command: 'pnpm', args: ['run', 'verify:seo:scaffold'] },
]

/** Fast path for `dev` / `build` / `test` — full suite in `verify:seo:full` or nightly. */
const QUICK_CHECK_IDS = new Set(['contracts', 'jsonld', 'infra', 'noindex', 'sitemap', 'canonical'])

const reportsDir = join(process.cwd(), '.seo', 'reports')

function nowIsoCompact() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function runCheck(def) {
  const startedAt = Date.now()
  const proc = spawnSync(def.command, def.args, {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: process.env,
    shell: true,
  })
  const elapsedMs = Date.now() - startedAt
  const stdout = (proc.stdout || '').trim()
  const stderr = (proc.stderr || '').trim()
  return {
    id: def.id,
    command: [def.command, ...def.args].join(' '),
    ok: proc.status === 0,
    exitCode: proc.status ?? 1,
    elapsedMs,
    stdout,
    stderr,
  }
}

function writeReport(report) {
  mkdirSync(reportsDir, { recursive: true })
  const latestPath = join(reportsDir, 'latest.json')
  const stampedPath = join(reportsDir, `${nowIsoCompact()}.json`)
  const body = JSON.stringify(report, null, 2)
  writeFileSync(latestPath, body, 'utf8')
  writeFileSync(stampedPath, body, 'utf8')
  return { latestPath, stampedPath }
}

function printCheckResult(result) {
  const status = result.ok ? 'OK' : 'FAIL'
  console.log(`[${status}] ${result.id} (${result.elapsedMs}ms)`)
  if (!result.ok && result.stderr) console.error(result.stderr)
}

function main() {
  const quick = process.argv.includes('--quick')
  const activeChecks = quick ? checks.filter((c) => QUICK_CHECK_IDS.has(c.id)) : checks

  const startedAtIso = new Date().toISOString()
  const startedMs = Date.now()
  const results = []

  for (const check of activeChecks) {
    const result = runCheck(check)
    results.push(result)
    printCheckResult(result)
  }

  const ok = results.every((r) => r.ok)
  const report = {
    version: 1,
    suite: quick ? 'verify:seo-quick' : 'verify:seo-full',
    ok,
    startedAt: startedAtIso,
    finishedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedMs,
    checks: results,
  }
  const files = writeReport(report)

  console.log(`SEO report written: ${files.latestPath}`)
  if (!ok) {
    console.error(`SEO verification failed. Detailed report: ${files.stampedPath}`)
    process.exit(1)
  }
  console.log(`SEO verification passed: ${results.length}/${activeChecks.length} checks`)
}

main()

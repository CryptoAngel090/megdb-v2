#!/usr/bin/env node
/**
 * N× Lighthouse (performance only) per URL → median LCP / FCP / perf score.
 *
 * Prereq: production server already running (e.g. `pnpm exec next start -p 3000` in apps/web).
 *
 * Examples:
 *   pnpm lh:lcp
 *   pnpm lh:lcp -- --runs 10 --base http://localhost:3010
 *   pnpm lh:lcp -- --path / --path /movies --runs 3 --out-dir lighthouse-runs
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LH_VERSION = '11.7.1'
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function median(nums) {
  const s = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (s.length === 0) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function parseArgs(argv) {
  const out = {
    runs: 5,
    base: 'http://localhost:3000',
    paths: /** @type {string[]} */ ([]),
    outDir: join(REPO_ROOT, 'lighthouse-runs'),
    keepJson: true,
    help: false,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') out.help = true
    else if (a === '--runs') out.runs = Math.max(1, parseInt(String(argv[++i]), 10) || 5)
    else if (a === '--base') out.base = String(argv[++i] ?? out.base)
    else if (a === '--path') out.paths.push(String(argv[++i] ?? ''))
    else if (a === '--out-dir') out.outDir = String(argv[++i] ?? out.outDir)
    else if (a === '--no-keep-json') out.keepJson = false
  }
  if (out.paths.length === 0) out.paths = ['/', '/movies']
  return out
}

function slugForPath(pathname) {
  if (pathname === '/' || pathname === '') return 'home'
  return pathname.replace(/^\//, '').replace(/\//g, '-') || 'page'
}

function readMetrics(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
  const audits = raw.audits ?? {}
  const perf = raw.categories?.performance?.score
  return {
    lcp: audits['largest-contentful-paint']?.numericValue ?? null,
    fcp: audits['first-contentful-paint']?.numericValue ?? null,
    perf: perf == null ? null : Math.round(perf * 100),
  }
}

function runOnce(url, jsonPath) {
  const args = [
    'dlx',
    `lighthouse@${LH_VERSION}`,
    url,
    '--only-categories=performance',
    '--output=json',
    `--output-path=${jsonPath}`,
    '--chrome-flags=--headless=new',
    '--quiet',
  ]
  const r = spawnSync('pnpm', args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  })
  return r.status === 0
}

function pad(s, n) {
  return String(s).padEnd(n)
}

function main() {
  const cfg = parseArgs(process.argv)
  if (cfg.help) {
    console.log(`Usage: node scripts/lighthouse-lcp.mjs [options]

Options:
  --runs N          Lighthouse runs per URL (default: 5)
  --base URL        Origin, e.g. http://localhost:3010 (default: http://localhost:3000)
  --path P          Extra path (repeatable). Default paths: / and /movies
  --out-dir DIR     JSON output directory (default: ./lighthouse-runs)
  --no-keep-json    Delete per-run JSON after parsing (still writes summary JSON)
  -h, --help

Start the app first, e.g.:
  cd apps/web && pnpm exec next start -p 3000`)
    process.exit(0)
  }

  mkdirSync(cfg.outDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')

  /** @type {Record<string, { url: string, lcp: number[], fcp: number[], perf: number[] }>} */
  const bySlug = {}

  for (const p of cfg.paths) {
    const url = new URL(p, cfg.base).href
    const slug = slugForPath(new URL(url).pathname)
    if (!bySlug[slug]) bySlug[slug] = { url, lcp: [], fcp: [], perf: [] }

    console.log(`\n→ ${url} (${cfg.runs} runs)`)
    for (let i = 1; i <= cfg.runs; i++) {
      const jsonPath = join(cfg.outDir, `${stamp}-${slug}-run-${i}.json`)
      process.stdout.write(`  run ${i}/${cfg.runs} … `)
      const ok = runOnce(url, jsonPath)
      if (!ok) {
        console.log('FAILED')
        process.exitCode = 1
        continue
      }
      const m = readMetrics(jsonPath)
      bySlug[slug].lcp.push(m.lcp)
      bySlug[slug].fcp.push(m.fcp)
      bySlug[slug].perf.push(m.perf)
      console.log(`LCP ${m.lcp != null ? `${(m.lcp / 1000).toFixed(2)}s` : 'n/a'}`)
      if (!cfg.keepJson) {
        try {
          unlinkSync(jsonPath)
        } catch {
          /* ignore */
        }
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    lighthouse: LH_VERSION,
    runsPerUrl: cfg.runs,
    base: cfg.base,
    urls: Object.fromEntries(
      Object.entries(bySlug).map(([slug, v]) => [
        slug,
        {
          url: v.url,
          medianLcpMs: median(v.lcp),
          medianFcpMs: median(v.fcp),
          medianPerf: median(v.perf),
          lcpAllMs: v.lcp,
          fcpAllMs: v.fcp,
          perfAll: v.perf,
        },
      ])
    ),
  }

  const summaryPath = join(cfg.outDir, `${stamp}-summary.json`)
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8')

  console.log('\n── Median (lab, mobile throttling) ──')
  console.log(pad('URL', 36), pad('median LCP', 14), pad('median FCP', 14), 'median perf')
  for (const [slug, v] of Object.entries(bySlug)) {
    const ml = median(v.lcp)
    const mf = median(v.fcp)
    const mp = median(v.perf)
    console.log(
      pad(v.url, 36),
      pad(ml != null ? `${(ml / 1000).toFixed(2)} s` : 'n/a', 14),
      pad(mf != null ? `${(mf / 1000).toFixed(2)} s` : 'n/a', 14),
      mp != null ? String(Math.round(mp)) : 'n/a'
    )
  }
  console.log(`\nSummary: ${summaryPath}`)
}

main()

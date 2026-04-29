/**
 * External webmaster validation loop tracker (GSC + Bing).
 *
 * Commands:
 * - node seo-webmaster-loop.mjs status
 * - node seo-webmaster-loop.mjs record --gsc ok --bing ok --notes "..."
 *
 * Goal: enforce periodic external validation beyond local checks.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SEO_DIR = join(process.cwd(), '.seo')
const FILE = join(SEO_DIR, 'webmaster-loop.json')
const MAX_AGE_DAYS = Number.parseInt(process.env.SEO_WEBMASTER_MAX_AGE_DAYS || '14', 10)

function nowIso() {
  return new Date().toISOString()
}

function readState() {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    return null
  }
}

function writeState(state) {
  mkdirSync(SEO_DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(state, null, 2), 'utf8')
}

function ageDays(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

function getFlag(name) {
  const args = process.argv.slice(2)
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

function cmdStatus() {
  const state = readState()
  if (!state) {
    throw new Error(
      'No webmaster loop record found. Run: seo:webmaster:record --gsc ok --bing ok --notes "initial validation"'
    )
  }
  const age = ageDays(state.at)
  console.log(`Last external validation: ${state.at} (${age.toFixed(1)} days ago)`)
  console.log(`GSC: ${state.gsc}, Bing: ${state.bing}`)
  console.log(`Notes: ${state.notes || '-'}`)
  if (age > MAX_AGE_DAYS) {
    throw new Error(
      `External SEO validation is stale (> ${MAX_AGE_DAYS} days). Re-run GSC + Bing checks and record again.`
    )
  }
}

function cmdRecord() {
  const gsc = getFlag('--gsc') || 'ok'
  const bing = getFlag('--bing') || 'ok'
  const notes = getFlag('--notes') || ''
  const state = { at: nowIso(), gsc, bing, notes }
  writeState(state)
  console.log(`Recorded external validation at ${state.at}`)
}

function main() {
  const cmd = process.argv[2] || 'status'
  if (cmd === 'status') return cmdStatus()
  if (cmd === 'record') return cmdRecord()
  throw new Error(`Unknown command: ${cmd}`)
}

try {
  main()
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
}

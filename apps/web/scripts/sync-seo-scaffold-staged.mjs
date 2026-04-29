import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { scaffoldChecksForSource } from './seo-scaffold-core.mjs'

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim()
}

function runSoft(command) {
  try {
    return run(command)
  } catch {
    return ''
  }
}

function readStagedFile(repoPath) {
  const raw = runSoft(`git show :${repoPath}`)
  return raw.length > 0 ? raw : null
}

function gitAtRoot(repoRoot, command) {
  return execSync(`git -C "${repoRoot}" ${command}`, { encoding: 'utf8' }).trim()
}

function getMissingContracts(repoPath, source) {
  const checks = scaffoldChecksForSource(repoPath, source)
  return Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)
}

function isStaticPagePath(repoPath) {
  if (!repoPath.startsWith('apps/web/src/app/')) return false
  if (!repoPath.endsWith('/page.tsx')) return false
  return !repoPath.includes('[')
}

function main() {
  const repoRoot = run('git rev-parse --show-toplevel')
  const changed = runSoft('git diff --cached --name-only --diff-filter=ACMR')
  const stagedFiles =
    changed.length === 0
      ? []
      : changed
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
  const stagedPages = stagedFiles.filter(isStaticPagePath)

  if (stagedPages.length === 0) {
    console.log('SEO staged sync: no static app page.tsx files staged.')
    return
  }

  const synced = []
  const unresolved = []

  for (const repoPath of stagedPages) {
    const stagedSource = readStagedFile(repoPath)
    if (!stagedSource) continue

    const stagedMissing = getMissingContracts(repoPath, stagedSource)
    if (stagedMissing.length === 0) continue

    const absPath = join(repoRoot, repoPath)
    if (!existsSync(absPath)) {
      unresolved.push({ repoPath, missing: stagedMissing, reason: 'working file missing' })
      continue
    }

    const workingSource = readFileSync(absPath, 'utf8')
    const workingMissing = getMissingContracts(repoPath, workingSource)

    if (workingMissing.length === 0) {
      gitAtRoot(repoRoot, `add -- "${repoPath}"`)
      synced.push(repoPath)
      continue
    }

    unresolved.push({
      repoPath,
      missing: stagedMissing,
      reason: `working tree still missing: ${workingMissing.join(', ')}`,
    })
  }

  if (synced.length > 0) {
    console.log(
      `SEO staged sync: auto-synced ${synced.length} file(s) from working tree into index:`
    )
    for (const file of synced) console.log(`- ${file}`)
  } else {
    console.log('SEO staged sync: no files required auto-sync.')
  }

  if (unresolved.length > 0) {
    console.error(`SEO staged sync unresolved in ${unresolved.length} file(s):`)
    for (const item of unresolved) {
      console.error(
        `- ${item.repoPath} -> missing in index: ${item.missing.join(', ')} (${item.reason})`
      )
    }
    console.error('')
    console.error('Fix new static pages with generator:')
    console.error(
      'pnpm --filter @repo/web run seo:create-page -- --path "/your-path" --title "Your Title" --description "Your description"'
    )
    process.exit(1)
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

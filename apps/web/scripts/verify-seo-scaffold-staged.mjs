import { execSync } from 'node:child_process'
import { scaffoldChecksForSource } from './seo-scaffold-core.mjs'

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim()
}

function readStagedFile(repoPath) {
  try {
    return execSync(`git show :${repoPath}`, { encoding: 'utf8' })
  } catch {
    return null
  }
}

function isStaticPagePath(repoPath) {
  if (!repoPath.startsWith('apps/web/src/app/')) return false
  if (!repoPath.endsWith('/page.tsx')) return false
  return !repoPath.includes('[')
}

function main() {
  const changed = run('git diff --cached --name-only --diff-filter=ACMR')
  const stagedFiles =
    changed.length === 0
      ? []
      : changed
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
  const stagedPages = stagedFiles.filter(isStaticPagePath)

  if (stagedPages.length === 0) {
    console.log('SEO staged scaffold OK: no static app page.tsx files staged.')
    return
  }

  const failures = []
  for (const repoPath of stagedPages) {
    const source = readStagedFile(repoPath)
    if (!source) continue
    const checks = scaffoldChecksForSource(repoPath, source)
    const missing = Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name)
    if (missing.length > 0) failures.push({ repoPath, missing })
  }

  if (failures.length > 0) {
    console.error(`SEO staged scaffold failed in ${failures.length} file(s):`)
    for (const item of failures) {
      console.error(`- ${item.repoPath} -> missing: ${item.missing.join(', ')}`)
    }
    console.error('')
    console.error('Fix option:')
    console.error(
      'pnpm --filter @repo/web run seo:create-page -- --path "/your-path" --title "Your Title" --description "Your description"'
    )
    process.exit(1)
  }

  console.log(`SEO staged scaffold OK: ${stagedPages.length} staged static page file(s) checked.`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

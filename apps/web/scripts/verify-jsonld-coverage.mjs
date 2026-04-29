import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pageJsonLdCoverage, parseScaffoldSource } from './seo-scaffold-core.mjs'

const APP_DIR = join(process.cwd(), 'src', 'app')

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...walk(full))
      continue
    }
    if (entry === 'page.tsx') out.push(full)
  }
  return out
}

const pages = walk(APP_DIR)
const missing = []

for (const file of pages) {
  const source = readFileSync(file, 'utf8')
  const ast = parseScaffoldSource(file, source)
  if (!pageJsonLdCoverage(ast)) missing.push(file)
}

if (missing.length > 0) {
  console.error(
    `JSON-LD coverage check failed. Missing structured data wiring in ${missing.length} page(s):`
  )
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

console.log(`JSON-LD coverage OK: ${pages.length} page.tsx files checked.`)

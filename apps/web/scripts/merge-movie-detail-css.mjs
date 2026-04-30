/**
 * Concatenates `movie-detail-css/MovieDetailPage.segment*.module.css` (01–10) into
 * `MovieDetailPage.module.css` so one CSS Modules scope preserves all local class names.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const base = path.join(__dirname, '..', 'src', 'components', 'MovieDetailPage')
const dir = path.join(base, 'movie-detail-css')
const outFile = path.join(base, 'MovieDetailPage.module.css')

const parts = []
for (let i = 1; i <= 10; i++) {
  const n = `MovieDetailPage.segment${String(i).padStart(2, '0')}.module.css`
  const f = path.join(dir, n)
  if (!fs.existsSync(f)) {
    console.error('Missing:', f)
    process.exit(1)
  }
  parts.push(fs.readFileSync(f, 'utf8').trimEnd())
}

const header =
  '/* MovieDetailPage — single CSS Module (merged from segments; one scope fixes class key collisions). */\n\n'

fs.writeFileSync(outFile, header + parts.join('\n\n') + '\n', 'utf8')
console.log('Wrote', path.relative(process.cwd(), outFile), `(${parts.length} segments)`)

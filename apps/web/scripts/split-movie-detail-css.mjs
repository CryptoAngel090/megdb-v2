/**
 * Splits `MovieDetailPage.module.css` into `movie-detail-css/MovieDetailPage.segment*.module.css`
 * (~180–270 lines) at top-level brace boundaries.
 *
 * **Do not** merge segments via `MovieDetailPage.styles.ts` object spread: the same local class
 * name in two `.module.css` files maps to different hashes — spread keeps one key → layout breaks.
 * After editing segments, run `node scripts/merge-movie-detail-css.mjs` to rebuild the monolith.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const base = path.join(__dirname, '..', 'src', 'components', 'MovieDetailPage')
const srcFile = path.join(base, 'MovieDetailPage.module.css')
const outDir = path.join(base, 'movie-detail-css')

const text = fs.readFileSync(srcFile, 'utf8')
const lines = text.split(/\r?\n/)

const SLIDE_UP_LINES = lines.slice(13, 23) // 1-based 14–23
const lazyIdx = lines.findIndex((l) => l.includes('@keyframes detailLazyPulse'))
const DETAIL_LAZY_LINES =
  lazyIdx >= 0 ? lines.slice(lazyIdx, lazyIdx + 10) : [] // keyframes + blank line guard

function depthDelta(line) {
  let d = 0
  for (const ch of line) {
    if (ch === '{') d++
    if (ch === '}') d--
  }
  return d
}

const segments = []
let depth = 0
let chunkStart = 0
let chunkLines = 0
const minChunk = 180
const maxChunk = 270

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  depth += depthDelta(line)
  chunkLines++

  const canCut =
    depth === 0 &&
    chunkLines >= minChunk &&
    (i === lines.length - 1 || chunkLines >= maxChunk - 20)

  if (canCut && i > chunkStart) {
    segments.push({ start: chunkStart, end: i + 1 })
    chunkStart = i + 1
    chunkLines = 0
    depth = 0
  }
}

if (chunkStart < lines.length) {
  segments.push({ start: chunkStart, end: lines.length })
}

fs.mkdirSync(outDir, { recursive: true })

const names = []
segments.forEach((seg, idx) => {
  const pad = String(idx + 1).padStart(2, '0')
  const name = `MovieDetailPage.segment${pad}.module.css`
  names.push(name)
  let body = lines.slice(seg.start, seg.end).join('\n')

  const hasSlideKeyframes = /@keyframes\s+slideUp\b/.test(body)
  const needsSlide =
    /animation:\s*slideUp\b/.test(body) && !hasSlideKeyframes
  const needsLazyKeyframes =
    /animation:\s*detailLazyPulse\b/.test(body) && !/@keyframes\s+detailLazyPulse\b/.test(body)

  const header = `/* MovieDetailPage CSS segment ${idx + 1}/${segments.length} */\n`
  let pre = ''
  if (needsSlide) pre += `${SLIDE_UP_LINES.join('\n')}\n\n`
  if (needsLazyKeyframes && DETAIL_LAZY_LINES.length) pre += `${DETAIL_LAZY_LINES.join('\n')}\n\n`

  fs.writeFileSync(path.join(outDir, name), header + pre + body + '\n', 'utf8')
})

const stylesBarrel = `/* Single CSS Module scope — merging segment modules via object spread breaks
 * when the same local class name exists in more than one file (last hash wins, base rules lost). */
import styles from './MovieDetailPage.module.css'

export default styles
`

fs.writeFileSync(path.join(base, 'MovieDetailPage.styles.ts'), stylesBarrel, 'utf8')
console.log('Wrote MovieDetailPage.styles.ts (import single module — run merge-movie-detail-css.mjs after editing segments).')

const counts = segments.map((s) => s.end - s.start)
console.log('segments', segments.length, 'line counts', counts.join(', '))
console.log('max', Math.max(...counts))

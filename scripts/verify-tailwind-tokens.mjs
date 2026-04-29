#!/usr/bin/env node
/**
 * Phase 3.2 — forbid numeric Tailwind spacing/sizing utilities in JSX/TSX.
 * Use semantic keys from `theme/tokens/size.ts` (w-xs, px-md, gap-md, …).
 *
 * Scans className values via TypeScript AST + join(' ') string arrays.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

const REPO_ROOT = join(import.meta.dirname, '..')

const SCAN_ROOTS = [
  join(REPO_ROOT, 'apps', 'web', 'src'),
  join(REPO_ROOT, 'packages', 'ui', 'src'),
  join(REPO_ROOT, 'apps', 'admin', 'src'),
]

/** Match utilities that must use token names, not default scale digits. */
const FORBIDDEN = [
  // width/height (allow w-1/2: number must not be followed by /)
  /\b(?:max-w|min-w|max-h|min-h|w|h)-(\d+(?:\.\d+)?)(?!\/)\b/g,
  /\b(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|space-x|space-y)-(\d+(?:\.\d+)?)\b/g,
  /\bsize-(\d+(?:\.\d+)?)\b/g,
  /\bgrid-cols-(\d+)\b/g,
  /\bgrid-rows-(\d+)\b/g,
  // typography: enforce semantic token keys from theme/tokens/size.ts
  /\bleading-(\d+(?:\.\d+)?)\b/g,
  /\btracking-(?:wide|wider|widest)\b/g,
]

/** Arbitrary px/rem in brackets (prefer tokens / theme). */
const ARBITRARY_LEN =
  /\b(?:w|h|min-w|max-w|min-h|max-h|p|px|py|m|mx|my|gap)-\[[^\]]*(?:\d+(?:\.\d+)?)(?:px|rem)\b[^\]]*\]/gi
/**
 * Ban dynamic token utility template patterns in className:
 * - use centralized maps from `theme/tokens/classes.ts` instead
 *   (`sizeClasses`, `spacingClasses`, `borderRadiusClasses`).
 */
const DYNAMIC_TOKEN_TEMPLATE = /\b(?:w|h|p|px|py|rounded)-\$\{/g

function shouldSkipPath(rel) {
  return (
    rel.includes('node_modules') ||
    /\.test\.tsx?$/.test(rel) ||
    rel.includes('__tests__') ||
    rel.includes('/.next/')
  )
}

function walkDir(dir, out) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    const full = join(dir, name)
    if (shouldSkipPath(relative(REPO_ROOT, full))) continue
    const st = statSync(full)
    if (st.isDirectory()) walkDir(full, out)
    else if (/\.(tsx|jsx)$/.test(name)) out.push(full)
  }
}

/** @param {string} text */
function findViolations(text) {
  const hits = []
  for (const re of FORBIDDEN) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) hits.push(m[0])
  }
  ARBITRARY_LEN.lastIndex = 0
  let m
  while ((m = ARBITRARY_LEN.exec(text)) !== null) hits.push(m[0])
  DYNAMIC_TOKEN_TEMPLATE.lastIndex = 0
  while ((m = DYNAMIC_TOKEN_TEMPLATE.exec(text)) !== null) hits.push(m[0])
  return [...new Set(hits)]
}

/**
 * @param {ts.Node | undefined} node
 * @param {ts.SourceFile} sf
 * @param {(text: string, pos: number) => void} onText
 */
function collectClassText(node, sf, onText) {
  if (!node) return

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    onText(node.text, node.getStart(sf))
    return
  }

  if (ts.isTemplateExpression(node)) {
    let flat = node.head.text
    for (const span of node.templateSpans) {
      flat += ' '
      flat += span.literal.text
    }
    onText(flat, node.getStart(sf))
    return
  }

  if (ts.isJsxExpression(node) && node.expression) {
    collectClassText(node.expression, sf, onText)
    return
  }

  if (ts.isCallExpression(node)) {
    const callee = node.expression
    let fn = ''
    if (ts.isIdentifier(callee)) fn = callee.text
    else if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.name))
      fn = callee.name.text

    if (fn === 'join' && ts.isPropertyAccessExpression(callee)) {
      const arr = callee.expression
      if (ts.isArrayLiteralExpression(arr)) {
        for (const el of arr.elements) {
          if (el && ts.isStringLiteral(el)) onText(el.text, el.getStart(sf))
        }
        return
      }
    }

    if (['clsx', 'cn', 'classNames', 'twMerge', 'cva'].includes(fn)) {
      for (const arg of node.arguments) {
        if (ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (!ts.isPropertyAssignment(prop)) continue
            const key = prop.name
            if (ts.isIdentifier(key)) onText(key.text, key.getStart(sf))
            else if (ts.isStringLiteral(key)) onText(key.text, key.getStart(sf))
          }
        } else {
          collectClassText(arg, sf, onText)
        }
      }
      return
    }
  }

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    collectClassText(node.left, sf, onText)
    collectClassText(node.right, sf, onText)
  }
}

/**
 * @param {string} filePath
 * @param {ts.SourceFile} sf
 */
function scanSourceFile(filePath, sf) {
  const violations = []

  /** @param {string} text @param {number} pos */
  function reportChunk(text, pos) {
    const bad = findViolations(text)
    if (bad.length === 0) return
    const { line, character } = sf.getLineAndCharacterOfPosition(pos)
    violations.push({
      line: line + 1,
      character: character + 1,
      hits: bad,
      chunk: text.slice(0, 120),
    })
  }

  function visit(node) {
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === 'className') {
      collectClassText(node.initializer, sf, reportChunk)
    }
    ts.forEachChild(node, visit)
  }

  visit(sf)
  return violations
}

function main() {
  const files = []
  for (const root of SCAN_ROOTS) {
    try {
      statSync(root)
    } catch {
      continue
    }
    walkDir(root, files)
  }

  const all = []
  for (const filePath of files) {
    const rel = relative(REPO_ROOT, filePath)
    if (shouldSkipPath(rel)) continue
    const source = readFileSync(filePath, 'utf8')
    const kind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
    const sf = ts.createSourceFile(rel, source, ts.ScriptTarget.Latest, true, kind)
    const v = scanSourceFile(filePath, sf)
    if (v.length) all.push({ rel, v })
  }

  if (all.length > 0) {
    console.error('Tailwind token check failed: forbidden utility patterns in className.\n')
    console.error(
      'Use token keys from theme/tokens/size.ts via tailwind.config, and centralized class maps from theme/tokens/classes.ts (sizeClasses / spacingClasses / borderRadiusClasses).\n'
    )
    for (const { rel, v } of all) {
      console.error(rel)
      for (const row of v) {
        console.error(
          `  ${row.line}:${row.character}  ${row.hits.join(', ')}  | ${JSON.stringify(row.chunk)}`
        )
      }
    }
    process.exit(1)
  }

  console.log(`verify-tailwind-tokens: OK (${files.length} files)`)
}

main()

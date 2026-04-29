import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const SRC_DIR = join(ROOT, 'src')
const SOURCE_EXTENSIONS = new Set(['.tsx', '.jsx'])
const DUPLICATE_STATE_PATTERN = /(?:^|\s)(?:hover|focus|active):bg-[^\s]+/g
const ARIA_DATA_BG_PATTERN = /(?:^|\s)(?:aria-[\w-]+|data-\[[^\]]+\]):bg-([^\s]+)/g

function hasSourceExtension(path) {
  return [...SOURCE_EXTENSIONS].some((ext) => path.endsWith(ext))
}

function collectSourceFiles(directory, output) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      collectSourceFiles(path, output)
      continue
    }
    if (hasSourceExtension(path)) output.push(path)
  }
}

function createSourceFile(path, source) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
}

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function collectStringLiteralsFromExpression(node, output) {
  if (!node) return

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    output.push(node.text)
    return
  }

  if (ts.isConditionalExpression(node)) {
    collectStringLiteralsFromExpression(node.whenTrue, output)
    collectStringLiteralsFromExpression(node.whenFalse, output)
    return
  }

  if (ts.isBinaryExpression(node)) {
    collectStringLiteralsFromExpression(node.left, output)
    collectStringLiteralsFromExpression(node.right, output)
    return
  }

  if (ts.isParenthesizedExpression(node)) {
    collectStringLiteralsFromExpression(node.expression, output)
    return
  }

  if (ts.isArrayLiteralExpression(node)) {
    for (const element of node.elements) {
      collectStringLiteralsFromExpression(element, output)
    }
  }
}

function checkClassValue(classValue) {
  if (!classValue.includes('btn-primary')) return []

  const duplicates = classValue.match(DUPLICATE_STATE_PATTERN) ?? []
  const nonSemanticStateBackgrounds = []
  let match
  ARIA_DATA_BG_PATTERN.lastIndex = 0
  while ((match = ARIA_DATA_BG_PATTERN.exec(classValue)) !== null) {
    const full = match[0].trim()
    const bgToken = match[1]
    if (bgToken !== 'primary') nonSemanticStateBackgrounds.push(full)
  }

  return [...duplicates.map((item) => item.trim()), ...nonSemanticStateBackgrounds]
}

const files = []
collectSourceFiles(SRC_DIR, files)

const violations = []

for (const filePath of files) {
  const source = readFileSync(filePath, 'utf8')
  const sourceFile = createSourceFile(filePath, source)

  walk(sourceFile, (node) => {
    if (!ts.isJsxAttribute(node)) return
    if (node.name.text !== 'className') return
    if (!node.initializer) return

    const values = []
    if (ts.isStringLiteral(node.initializer)) {
      values.push(node.initializer.text)
    } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
      collectStringLiteralsFromExpression(node.initializer.expression, values)
    }

    for (const value of values) {
      const duplicateStates = checkClassValue(value)
      if (duplicateStates.length === 0) continue

      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
      violations.push({
        filePath: relative(ROOT, filePath),
        line: line + 1,
        duplicateStates,
        value,
      })
    }
  })
}

if (violations.length > 0) {
  console.error(
    'Semantic button state check failed: for "btn-primary", avoid explicit hover/focus/active bg-* and use semantic aria/data state backgrounds (e.g. aria-selected:bg-primary).'
  )
  for (const violation of violations) {
    console.error(`- ${violation.filePath}:${violation.line}`)
    console.error(`  duplicate states: ${violation.duplicateStates.join(', ')}`)
    console.error(`  className: "${violation.value}"`)
  }
  process.exit(1)
}

console.log(`Semantic button state check OK: scanned ${files.length} files.`)

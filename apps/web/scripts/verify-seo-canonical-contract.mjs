import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const LIB = join(ROOT, 'src', 'lib')
const files = [
  join(LIB, 'moviesDiscoverCopy.ts'),
  join(LIB, 'seriesDiscoverCopy.ts'),
  join(LIB, 'tvShowsDiscoverCopy.ts'),
  join(LIB, 'cartoonsDiscoverCopy.ts'),
]

const issues = []

function parseSourceFile(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function hasCanonicalImport(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return
    if (
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== '@/lib/canonicalQuery'
    )
      return
    const clause = node.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) return
    for (const spec of clause.namedBindings.elements) {
      if (spec.name.text === 'buildCanonicalPath') ok = true
    }
  })
  return ok
}

function hasBuildCanonicalPathCall(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return
    if (node.expression.text === 'buildCanonicalPath') ok = true
  })
  return ok
}

function hasUrlSearchParamsUsage(sourceFile) {
  let found = false
  walk(sourceFile, (node) => {
    if (!ts.isNewExpression(node) || !ts.isIdentifier(node.expression)) return
    if (node.expression.text === 'URLSearchParams') found = true
  })
  return found
}

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const ast = parseSourceFile(file, src)
  if (!hasCanonicalImport(ast)) {
    issues.push(`${file} (missing canonicalQuery import)`)
  }
  if (!hasBuildCanonicalPathCall(ast)) {
    issues.push(`${file} (missing buildCanonicalPath usage)`)
  }
  if (hasUrlSearchParamsUsage(ast)) {
    issues.push(`${file} (manual URLSearchParams detected; use buildCanonicalPath)`)
  }
}

if (issues.length > 0) {
  console.error(`SEO canonical contract failed: ${issues.length} issue(s) found:`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log(`SEO canonical contract OK: ${files.length} discover canonical modules verified.`)

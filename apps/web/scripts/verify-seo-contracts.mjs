import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { hasExportedFunction, isExportedVariable, walk } from './ts-ast-utils.mjs'

const APP_DIR = join(process.cwd(), 'src', 'app')

function walkDir(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...walkDir(full))
      continue
    }
    if (entry === 'page.tsx' || entry === 'not-found.tsx') out.push(full)
  }
  return out
}

function parseSourceFile(path, source) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
}

function propName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

function hasCallExpressionByName(sourceFile, names) {
  const set = new Set(names)
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return
    if (set.has(node.expression.text)) ok = true
  })
  return ok
}

function hasIdentifierReference(sourceFile, names) {
  const set = new Set(names)
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isIdentifier(node)) return
    if (set.has(node.text)) ok = true
  })
  return ok
}

function hasPropertyUsage(sourceFile, names) {
  const set = new Set(names)
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    if (set.has(propName(node.name))) ok = true
  })
  return ok
}

function hasMetadataContract(path, source) {
  const ast = parseSourceFile(path, source)
  let hasMetadata = false
  walk(ast, (node) => {
    if (isExportedVariable(node, 'metadata')) hasMetadata = true
    if (isExportedVariable(node, 'generateMetadata')) hasMetadata = true
  })
  return hasMetadata || hasExportedFunction(ast, 'generateMetadata')
}

function hasCanonicalContract(path, source) {
  const ast = parseSourceFile(path, source)
  if (hasPropertyUsage(ast, ['alternates'])) return true
  if (
    hasIdentifierReference(ast, ['generateTvSeriesDetailMetadata', 'generateCartoonDetailMetadata'])
  )
    return true
  return hasCallExpressionByName(ast, [
    'generateTvSeriesDetailMetadata',
    'generateCartoonDetailMetadata',
  ])
}

function hasSocialContract(path, source) {
  const ast = parseSourceFile(path, source)
  if (
    hasIdentifierReference(ast, ['generateTvSeriesDetailMetadata', 'generateCartoonDetailMetadata'])
  )
    return true
  if (hasCallExpressionByName(ast, ['discoverSocialMeta'])) return true
  if (
    hasCallExpressionByName(ast, [
      'generateTvSeriesDetailMetadata',
      'generateCartoonDetailMetadata',
    ])
  )
    return true
  if (hasPropertyUsage(ast, ['openGraph', 'twitter'])) return true
  return hasExportedFunction(ast, 'generateMetadata')
}

const files = walkDir(APP_DIR)

const missingMetadata = []
const missingCanonical = []
const missingSocial = []

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const isNotFound = file.endsWith('not-found.tsx')
  if (!hasMetadataContract(file, source)) missingMetadata.push(file)
  if (!isNotFound && !hasCanonicalContract(file, source)) missingCanonical.push(file)
  if (!isNotFound && !hasSocialContract(file, source)) missingSocial.push(file)
}

let failed = false

if (missingMetadata.length > 0) {
  failed = true
  console.error(
    `SEO contracts failed: missing metadata contract in ${missingMetadata.length} file(s):`
  )
  for (const file of missingMetadata) console.error(`- ${file}`)
}

if (missingCanonical.length > 0) {
  failed = true
  console.error(
    `SEO contracts failed: missing canonical contract in ${missingCanonical.length} file(s):`
  )
  for (const file of missingCanonical) console.error(`- ${file}`)
}

if (missingSocial.length > 0) {
  failed = true
  console.error(`SEO contracts failed: missing social contract in ${missingSocial.length} file(s):`)
  for (const file of missingSocial) console.error(`- ${file}`)
}

if (failed) process.exit(1)

console.log(`SEO contracts OK: ${files.length} route files checked.`)

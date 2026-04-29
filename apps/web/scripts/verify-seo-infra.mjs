import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const ROOT = process.cwd()
const APP = join(ROOT, 'src', 'app')

const REQUIRED_FILES = [
  join(APP, 'layout.tsx'),
  join(APP, 'robots.ts'),
  join(APP, 'sitemap.ts'),
  join(APP, 'manifest.ts'),
  join(APP, 'opengraph-image.tsx'),
  join(APP, 'opengraph-image.alt.txt'),
  join(APP, 'twitter-image.tsx'),
  join(APP, 'twitter-image.alt.txt'),
  join(APP, 'indexnow-key', 'route.ts'),
  join(APP, 'api', 'seo', 'indexnow', 'route.ts'),
]

const missing = REQUIRED_FILES.filter((f) => !existsSync(f))
if (missing.length > 0) {
  console.error(`SEO infra check failed: missing ${missing.length} required file(s):`)
  for (const f of missing) console.error(`- ${f}`)
  process.exit(1)
}

function parseSourceFile(path, source) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
}

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function propName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

function findMetadataObject(sourceFile) {
  let out = null
  walk(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return
    const isExported = (node.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!isExported) return
    for (const d of node.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || d.name.text !== 'metadata') continue
      if (d.initializer && ts.isObjectLiteralExpression(d.initializer)) out = d.initializer
    }
  })
  return out
}

function getObjectProp(obj, name) {
  return obj.properties.find((p) => ts.isPropertyAssignment(p) && propName(p.name) === name) ?? null
}

function hasManifest(obj) {
  const prop = getObjectProp(obj, 'manifest')
  return (
    prop &&
    ts.isPropertyAssignment(prop) &&
    ts.isStringLiteral(prop.initializer) &&
    prop.initializer.text === '/manifest.webmanifest'
  )
}

function hasMetadataBase(obj) {
  const prop = getObjectProp(obj, 'metadataBase')
  return Boolean(prop)
}

function arrayContainsStringLiteral(arr, value) {
  return arr.elements.some((el) => ts.isStringLiteral(el) && el.text === value)
}

function hasOpenGraphImage(obj) {
  const openGraph = getObjectProp(obj, 'openGraph')
  if (
    !openGraph ||
    !ts.isPropertyAssignment(openGraph) ||
    !ts.isObjectLiteralExpression(openGraph.initializer)
  ) {
    return false
  }
  const images = getObjectProp(openGraph.initializer, 'images')
  if (
    !images ||
    !ts.isPropertyAssignment(images) ||
    !ts.isArrayLiteralExpression(images.initializer)
  ) {
    return false
  }
  for (const el of images.initializer.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue
    const urlProp = getObjectProp(el, 'url')
    if (
      urlProp &&
      ts.isPropertyAssignment(urlProp) &&
      ts.isStringLiteral(urlProp.initializer) &&
      urlProp.initializer.text === '/opengraph-image'
    ) {
      return true
    }
  }
  return false
}

function hasTwitterImage(obj) {
  const twitter = getObjectProp(obj, 'twitter')
  if (
    !twitter ||
    !ts.isPropertyAssignment(twitter) ||
    !ts.isObjectLiteralExpression(twitter.initializer)
  ) {
    return false
  }
  const images = getObjectProp(twitter.initializer, 'images')
  if (
    !images ||
    !ts.isPropertyAssignment(images) ||
    !ts.isArrayLiteralExpression(images.initializer)
  ) {
    return false
  }
  return arrayContainsStringLiteral(images.initializer, '/twitter-image')
}

const layoutPath = join(APP, 'layout.tsx')
const layoutAst = parseSourceFile(layoutPath, readFileSync(layoutPath, 'utf8'))
const metadataObj = findMetadataObject(layoutAst)
if (!metadataObj) {
  console.error('SEO infra check failed: missing exported metadata object in layout.tsx')
  process.exit(1)
}

const missingLayout = []
if (!hasMetadataBase(metadataObj)) missingLayout.push('metadataBase')
if (!hasOpenGraphImage(metadataObj))
  missingLayout.push("openGraph.images includes { url: '/opengraph-image' }")
if (!hasTwitterImage(metadataObj)) missingLayout.push("twitter.images includes '/twitter-image'")
if (!hasManifest(metadataObj)) missingLayout.push("manifest: '/manifest.webmanifest'")

if (missingLayout.length > 0) {
  console.error('SEO infra check failed: layout metadata invariants missing:')
  for (const s of missingLayout) console.error(`- ${s}`)
  process.exit(1)
}

console.log(`SEO infra OK: ${REQUIRED_FILES.length} files + layout metadata invariants checked.`)

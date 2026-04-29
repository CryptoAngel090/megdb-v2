import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { walk } from './ts-ast-utils.mjs'

const APP = join(process.cwd(), 'src', 'app')
const LIB = join(process.cwd(), 'src', 'lib')

const JSONLD_FILE = join(LIB, 'jsonLdSite.ts')
const LAYOUT_FILE = join(APP, 'layout.tsx')

const issues = []

function parseSourceFile(path, source) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
}

function propName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  return ''
}

function hasNamedImport(sourceFile, fromModule, names) {
  const needed = new Set(names)
  const found = new Set()
  walk(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return
    if (!ts.isStringLiteral(node.moduleSpecifier) || node.moduleSpecifier.text !== fromModule)
      return
    const clause = node.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) return
    for (const el of clause.namedBindings.elements) {
      if (needed.has(el.name.text)) found.add(el.name.text)
    }
  })
  return names.every((n) => found.has(n))
}

function hasDateModifiedSeoConstant(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'dateModified') return
    if (ts.isIdentifier(node.initializer) && node.initializer.text === 'SEO_LAST_REVIEWED_AT')
      ok = true
  })
  return ok
}

function hasOrganizationEeatFields(sourceFile) {
  let ok = false
  walk(sourceFile, (node) => {
    if (
      !ts.isVariableDeclaration(node) ||
      !ts.isIdentifier(node.name) ||
      node.name.text !== 'organization'
    )
      return
    if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) return
    const org = node.initializer
    const hasFoundingDate = org.properties.some(
      (p) =>
        ts.isPropertyAssignment(p) &&
        propName(p.name) === 'foundingDate' &&
        ts.isIdentifier(p.initializer) &&
        p.initializer.text === 'SEO_FOUNDED_DATE'
    )
    const hasEmail = org.properties.some(
      (p) =>
        ts.isPropertyAssignment(p) &&
        propName(p.name) === 'email' &&
        ts.isIdentifier(p.initializer) &&
        p.initializer.text === 'SEO_CONTACT_EMAIL'
    )
    const hasKnowsAbout = org.properties.some(
      (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'knowsAbout'
    )
    const contactPoint = org.properties.find(
      (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'contactPoint'
    )
    let hasContactPoint = false
    if (
      contactPoint &&
      ts.isPropertyAssignment(contactPoint) &&
      ts.isObjectLiteralExpression(contactPoint.initializer)
    ) {
      hasContactPoint = contactPoint.initializer.properties.some(
        (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'areaServed'
      )
    }
    if (hasFoundingDate && hasEmail && hasKnowsAbout && hasContactPoint) ok = true
  })
  return ok
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

function hasRootMetadataEeat(sourceFile) {
  const obj = findMetadataObject(sourceFile)
  if (!obj) return false
  const hasApplicationName = obj.properties.some(
    (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'applicationName'
  )
  const hasPublisher = obj.properties.some(
    (p) =>
      ts.isPropertyAssignment(p) &&
      propName(p.name) === 'publisher' &&
      ts.isIdentifier(p.initializer) &&
      p.initializer.text === 'SEO_PUBLISHER_NAME'
  )
  const hasAuthors = obj.properties.some(
    (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'authors'
  )
  const other = obj.properties.find(
    (p) => ts.isPropertyAssignment(p) && propName(p.name) === 'other'
  )
  let hasContactEmail = false
  let hasModified = false
  if (other && ts.isPropertyAssignment(other) && ts.isObjectLiteralExpression(other.initializer)) {
    for (const p of other.initializer.properties) {
      if (!ts.isPropertyAssignment(p)) continue
      const k = propName(p.name)
      if (k === 'contact:email') hasContactEmail = true
      if (
        k === 'article:modified_time' &&
        ts.isIdentifier(p.initializer) &&
        p.initializer.text === 'SEO_LAST_REVIEWED_AT'
      ) {
        hasModified = true
      }
    }
  }
  return hasApplicationName && hasPublisher && hasAuthors && hasContactEmail && hasModified
}

const jsonLdAst = parseSourceFile(JSONLD_FILE, readFileSync(JSONLD_FILE, 'utf8'))
if (
  !hasNamedImport(jsonLdAst, '@/lib/seoFreshness', [
    'SEO_CONTACT_EMAIL',
    'SEO_FOUNDED_DATE',
    'SEO_LAST_REVIEWED_AT',
  ])
) {
  issues.push({
    label: 'jsonLdSite freshness imports',
    file: JSONLD_FILE,
    missing: ['SEO_CONTACT_EMAIL/SEO_FOUNDED_DATE/SEO_LAST_REVIEWED_AT imports'],
  })
}
if (!hasDateModifiedSeoConstant(jsonLdAst)) {
  issues.push({
    label: 'jsonLdSite dateModified freshness',
    file: JSONLD_FILE,
    missing: ['dateModified: SEO_LAST_REVIEWED_AT'],
  })
}
if (!hasOrganizationEeatFields(jsonLdAst)) {
  issues.push({
    label: 'jsonLdSite organization E-E-A-T fields',
    file: JSONLD_FILE,
    missing: ['foundingDate + email + knowsAbout + contactPoint.areaServed'],
  })
}

const layoutAst = parseSourceFile(LAYOUT_FILE, readFileSync(LAYOUT_FILE, 'utf8'))
if (
  !hasNamedImport(layoutAst, '@/lib/seoFreshness', [
    'SEO_PUBLISHER_NAME',
    'SEO_CONTACT_EMAIL',
    'SEO_LAST_REVIEWED_AT',
  ])
) {
  issues.push({
    label: 'layout freshness imports',
    file: LAYOUT_FILE,
    missing: ['SEO_PUBLISHER_NAME/SEO_CONTACT_EMAIL/SEO_LAST_REVIEWED_AT imports'],
  })
}
if (!hasRootMetadataEeat(layoutAst)) {
  issues.push({
    label: 'root metadata freshness + publisher identity',
    file: LAYOUT_FILE,
    missing: [
      'applicationName + publisher: SEO_PUBLISHER_NAME + authors + other.contact:email + other.article:modified_time',
    ],
  })
}

if (issues.length > 0) {
  console.error(`SEO freshness/E-E-A-T contract failed: ${issues.length} check(s).`)
  for (const issue of issues) {
    console.error(`- ${issue.label}`)
    console.error(`  file: ${issue.file}`)
    for (const m of issue.missing) console.error(`  missing: ${m}`)
  }
  process.exit(1)
}

console.log('SEO freshness/E-E-A-T contract OK: 5 checks passed.')
